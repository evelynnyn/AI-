"""AI reader: builds the prompts and streams the reply as NDJSON.

Each line of the stream is one JSON object:
  {"t": "text"}                      a piece of the reply
  {"done": true}                     finished
  {"error": "message"}               failed; text already sent is kept (US-12)
  {"error": "message", "crisis": true}  self-harm signs: show helplines, no retry (SEC-01)
"""

import json
import logging
from collections.abc import AsyncIterator

from app.catalog import decks, readers, spreads
from app.llm import ChatMessage, LLMError, LLMErrorKind, LLMProvider
from app.schemas.ai import (
    MAX_FOLLOW_UPS,
    AiReadingRequest,
    FollowUpRequest,
    Suggestions,
    SuggestionsRequest,
)
from app.services import ai_prompts
from app.services.ai_prompts import ReadingContext, ReadingItem
from app.services.safety import mentions_self_harm

logger = logging.getLogger(__name__)

CRISIS_MESSAGE = (
    "謝謝你願意說出心裡的感受。你現在的狀態比任何一張牌都重要，此刻請先不要獨自承擔，"
    "找一位信任的人聊聊，或撥打下面的專線，會有人陪你。"
)

FRIENDLY: dict[LLMErrorKind, str] = {
    "config": "解讀師暫時無法上線（伺服器的 AI 設定有誤），請稍後再試。",
    "rate_limit": "現在想聽解讀的人有點多，請稍等一下再試一次。",
    "unavailable": "與解讀師的連線中斷了，請稍後再試一次。",
    "empty": "解讀師這次沒有說出話來，請再試一次。",
    "refusal": (
        "這個問題，解讀師沒辦法用牌來回答。如果願意，可以換個方式描述你的問題，或改天再來占卜一次。"
    ),
    "unknown": "解讀師暫時沒有回應，請稍後再試一次。",
}

MAX_SUGGESTION_LENGTH = 30


class InvalidAiRequestError(ValueError):
    pass


def friendly_message(error: Exception) -> str:
    return FRIENDLY[error.kind if isinstance(error, LLMError) else "unknown"]


def build_context(data: AiReadingRequest) -> ReadingContext:
    """Check the cards against the spread and deck, and look up their details."""
    spread = spreads()[data.spread]
    deck = decks()[spread.deckId]
    if len(data.cards) != len(spread.positions):
        raise InvalidAiRequestError(f"此牌陣需要 {len(spread.positions)} 張牌")
    if len({c.card_id for c in data.cards}) != len(data.cards):
        raise InvalidAiRequestError("同一張牌不能出現兩次")
    items: list[ReadingItem] = []
    for drawn, position in zip(data.cards, spread.positions, strict=True):
        card = deck.cards.get(drawn.card_id)
        if card is None:
            raise InvalidAiRequestError("找不到這張牌")
        reversed_ = drawn.reversed and deck.supports_reversed
        items.append(ReadingItem(card, "reversed" if reversed_ else "upright", position))
    return ReadingContext(deck=deck, spread=spread, question=data.question, items=items)


def _line(data: dict[str, object]) -> bytes:
    return (json.dumps(data, ensure_ascii=False) + "\n").encode()


async def stream_reply(
    provider: LLMProvider, system: str, messages: list[ChatMessage], user_texts: list[str]
) -> AsyncIterator[bytes]:
    # SEC-01: stop before reading the cards when the user shows signs of self-harm.
    if any(mentions_self_harm(text) for text in user_texts):
        yield _line({"error": CRISIS_MESSAGE, "crisis": True})
        return

    produced = False
    try:
        async for text in provider.stream_text(system, messages):
            if text:
                produced = True
                yield _line({"t": text})
        if not produced:
            raise LLMError("empty", f"{provider.name} returned no text")
        yield _line({"done": True})
    except LLMError as error:
        logger.warning("%s failed: %s", provider.name, error)
        yield _line({"error": friendly_message(error)})
    except Exception:
        logger.exception("%s failed", provider.name)
        yield _line({"error": friendly_message(Exception())})


def reading_stream(provider: LLMProvider, data: AiReadingRequest) -> AsyncIterator[bytes]:
    ctx = build_context(data)
    reader = readers()[data.reader]
    return stream_reply(
        provider,
        ai_prompts.build_system_prompt(reader),
        [{"role": "user", "content": ai_prompts.build_reading_context(ctx)}],
        [data.question],
    )


def follow_up_stream(provider: LLMProvider, data: FollowUpRequest) -> AsyncIterator[bytes]:
    if len(data.history) >= MAX_FOLLOW_UPS:
        raise InvalidAiRequestError("這次占卜的追問次數已經用完了。")
    ctx = build_context(data)
    reader = readers()[data.reader]
    history = [(t.question, t.answer) for t in data.history]
    return stream_reply(
        provider,
        ai_prompts.build_follow_up_system_prompt(reader),
        ai_prompts.build_follow_up_messages(ctx, data.ai_reading, history, data.follow_up),
        [data.question, *(t.question for t in data.history), data.follow_up],
    )


def parse_suggestions(text: str) -> list[str]:
    """Take the JSON array out of the model output, tolerating text around it."""
    start, end = text.find("["), text.rfind("]")
    if start < 0 or end <= start:
        return []
    try:
        data = json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    items = [s.strip() for s in data if isinstance(s, str)]
    unique = dict.fromkeys(s for s in items if 0 < len(s) <= MAX_SUGGESTION_LENGTH)
    return list(unique)[:3]


def fallback_suggestions(has_reversed: bool) -> list[str]:
    return [
        "我現在最該先做的一件事是什麼？",
        "其中的逆位牌要怎麼理解？" if has_reversed else "哪一張牌是這件事的關鍵？",
        "這件事大概多久會有變化？",
    ]


async def suggest_follow_ups(provider: LLMProvider, data: SuggestionsRequest) -> Suggestions:
    ctx = build_context(data)
    fallback = fallback_suggestions(any(it.orientation == "reversed" for it in ctx.items))
    try:
        text = "".join(
            [
                chunk
                async for chunk in provider.stream_text(
                    ai_prompts.SUGGESTION_SYSTEM,
                    [
                        {
                            "role": "user",
                            "content": ai_prompts.build_suggestion_message(ctx, data.ai_reading),
                        }
                    ],
                )
            ]
        )
        suggestions = parse_suggestions(text)
        if len(suggestions) == 3:
            return Suggestions(suggestions=suggestions, generated=True)
        logger.warning("could not parse suggestions: %s", text[:200])
    except Exception:
        logger.exception("suggestions failed")
    return Suggestions(suggestions=fallback, generated=False)
