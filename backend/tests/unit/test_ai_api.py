"""AI reader API. Each test name starts with the acceptance criterion it checks (GitHub issues)."""

import json
from collections.abc import AsyncIterator, Iterator

import pytest
from fastapi.testclient import TestClient

from app.llm import ChatMessage, LLMError
from app.llm.mock_provider import MockProvider
from app.main import app
from app.routers.ai import get_llm_provider

THREE = {
    "reader": "magician",
    "spread": "three",
    "question": "我該換工作嗎？",
    "cards": [
        {"card_id": "fool"},
        {"card_id": "tower", "reversed": True},
        {"card_id": "five-of-cups"},
    ],
}
READING = "你抽到的這張愚者……"


class RecordingProvider:
    """Records every call so tests can check what the model was sent."""

    name = "recording"

    def __init__(self, chunks: list[str] | None = None, error: LLMError | None = None) -> None:
        self.calls: list[tuple[str, list[ChatMessage]]] = []
        self._chunks = chunks if chunks is not None else ["你好", "，我看到了"]
        self._error = error

    async def stream_text(self, system: str, messages: list[ChatMessage]) -> AsyncIterator[str]:
        self.calls.append((system, messages))
        for chunk in self._chunks:
            yield chunk
        if self._error:
            raise self._error


@pytest.fixture
def provider() -> Iterator[RecordingProvider]:
    fake = RecordingProvider()
    app.dependency_overrides[get_llm_provider] = lambda: fake
    yield fake
    app.dependency_overrides.clear()


def use(provider: object) -> None:
    app.dependency_overrides[get_llm_provider] = lambda: provider


def lines(text: str) -> list[dict[str, object]]:
    return [json.loads(line) for line in text.splitlines() if line.strip()]


def post(path: str, body: dict[str, object]):  # type: ignore[no-untyped-def]
    return TestClient(app).post(f"/api/v1/ai/{path}", json=body)


# US-07 選擇解讀師


@pytest.mark.parametrize("reader", ["high-priestess", "magician", "fool"])
def test_us07_ac1_reading_uses_the_chosen_readers_role(
    provider: RecordingProvider, reader: str
) -> None:
    from app.catalog import readers

    post("reading", {**THREE, "reader": reader})

    system, _ = provider.calls[0]
    assert readers()[reader].systemPrompt in system  # type: ignore[index]


def test_us07_ac2_default_reader_is_high_priestess(provider: RecordingProvider) -> None:
    body = {k: v for k, v in THREE.items() if k != "reader"}

    post("reading", body)

    assert "你是「女祭司」" in provider.calls[0][0]


def test_us07_ac3_unknown_reader_returns_422(provider: RecordingProvider) -> None:
    response = post("reading", {**THREE, "reader": "hermit"})

    assert response.status_code == 422
    assert provider.calls == []


# US-08 綜合解讀


def test_us08_ac1_reading_streams_text_then_done(provider: RecordingProvider) -> None:
    response = post("reading", THREE)

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/x-ndjson")
    assert lines(response.text) == [{"t": "你好"}, {"t": "，我看到了"}, {"done": True}]


def test_us08_ac4_card_count_must_match_spread(provider: RecordingProvider) -> None:
    response = post("reading", {**THREE, "cards": THREE["cards"][:2]})  # type: ignore[index]

    assert response.status_code == 400
    assert response.json() == {"detail": "此牌陣需要 3 張牌"}
    assert provider.calls == []


@pytest.mark.parametrize(
    ("cards", "detail"),
    [
        ([{"card_id": "fool"}, {"card_id": "fool"}, {"card_id": "sun"}], "同一張牌不能出現兩次"),
        ([{"card_id": "fool"}, {"card_id": "rider"}, {"card_id": "sun"}], "找不到這張牌"),
    ],
)
def test_us08_ac5_duplicate_or_unknown_cards_return_400(
    provider: RecordingProvider, cards: list[dict[str, str]], detail: str
) -> None:
    response = post("reading", {**THREE, "cards": cards})

    assert response.status_code == 400
    assert response.json() == {"detail": detail}
    assert provider.calls == []


@pytest.mark.parametrize("question", ["", "   ", "問" * 201])
def test_us08_ac7_blank_or_too_long_question_returns_422(
    provider: RecordingProvider, question: str
) -> None:
    response = post("reading", {**THREE, "question": question})

    assert response.status_code == 422
    assert provider.calls == []


# US-09 追問


def follow_up_body(history: int = 0, follow_up: str = "那我該先做什麼？") -> dict[str, object]:
    turns = [{"question": f"第{i}個問題", "answer": f"第{i}個回答"} for i in range(history)]
    return {**THREE, "ai_reading": READING, "history": turns, "follow_up": follow_up}


def test_us09_ac1_follow_up_carries_reading_and_history(provider: RecordingProvider) -> None:
    response = post("follow-up", follow_up_body(history=2))

    assert lines(response.text)[-1] == {"done": True}
    system, messages = provider.calls[0]
    assert "你是「魔術師」" in system
    assert "【追問的回答方式】" in system
    assert [m["role"] for m in messages] == ["user", "assistant"] * 3 + ["user"]
    assert "愚者" in messages[0]["content"]
    assert messages[1]["content"] == READING
    assert messages[2]["content"] == "第0個問題"
    assert messages[-1]["content"].startswith("那我該先做什麼？")


def test_us09_ac2_sixth_follow_up_returns_400(provider: RecordingProvider) -> None:
    allowed = post("follow-up", follow_up_body(history=4))
    blocked = post("follow-up", follow_up_body(history=5))

    assert allowed.status_code == 200
    assert blocked.status_code == 400
    assert blocked.json() == {"detail": "這次占卜的追問次數已經用完了。"}
    assert len(provider.calls) == 1


def test_us09_ac4_blank_follow_up_returns_422(provider: RecordingProvider) -> None:
    response = post("follow-up", follow_up_body(follow_up="   "))

    assert response.status_code == 422
    assert provider.calls == []


# US-10 建議追問


def test_us10_ac1_returns_three_ai_suggestions() -> None:
    use(MockProvider())

    response = post("follow-up/suggestions", {**THREE, "ai_reading": READING})

    assert response.json() == {
        "suggestions": ["我該主動一點嗎？", "這張逆位怎麼看？", "多久會有變化？"],
        "generated": True,
    }
    app.dependency_overrides.clear()


@pytest.mark.parametrize(
    "provider_output",
    [["這不是 JSON"], ['["只有一個"]'], ['["一","一","一"]']],
)
def test_us10_ac2_falls_back_to_generic_questions(provider_output: list[str]) -> None:
    use(RecordingProvider(chunks=provider_output))

    response = post("follow-up/suggestions", {**THREE, "ai_reading": READING})

    assert response.json() == {
        "suggestions": [
            "我現在最該先做的一件事是什麼？",
            "其中的逆位牌要怎麼理解？",
            "這件事大概多久會有變化？",
        ],
        "generated": False,
    }
    app.dependency_overrides.clear()


def test_us10_ac2_falls_back_when_the_ai_fails() -> None:
    use(RecordingProvider(chunks=[], error=LLMError("unavailable", "down")))
    body = {**THREE, "cards": [{"card_id": "fool"}, {"card_id": "sun"}, {"card_id": "moon"}]}

    response = post("follow-up/suggestions", {**body, "ai_reading": READING})

    data = response.json()
    assert data["generated"] is False
    assert "哪一張牌是這件事的關鍵？" in data["suggestions"]
    app.dependency_overrides.clear()


# US-12 AI 出錯時的友善提示


def test_us12_ac1_mid_stream_failure_keeps_text_and_sends_friendly_error() -> None:
    use(MockProvider(fail="1"))

    events = lines(post("reading", THREE).text)

    assert events[0] == {"t": "（"}
    assert events[-1] == {"error": "與解讀師的連線中斷了，請稍後再試一次。"}
    assert {"done": True} not in events
    app.dependency_overrides.clear()


def test_us12_ac2_empty_reply_sends_friendly_error() -> None:
    use(RecordingProvider(chunks=[]))

    events = lines(post("reading", THREE).text)

    assert events == [{"error": "解讀師這次沒有說出話來，請再試一次。"}]
    app.dependency_overrides.clear()


def test_us12_ac3_missing_ai_settings_returns_503(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import get_settings

    monkeypatch.setenv("LLM_PROVIDER", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "")
    get_settings.cache_clear()
    try:
        response = post("reading", THREE)
    finally:
        get_settings.cache_clear()

    assert response.status_code == 503
    assert response.json() == {"detail": "解讀師暫時無法上線（伺服器的 AI 設定有誤），請稍後再試。"}


# SEC-01 自傷跡象


CRISIS = {
    "error": (
        "謝謝你願意說出心裡的感受。你現在的狀態比任何一張牌都重要，此刻請先不要獨自承擔，"
        "找一位信任的人聊聊，或撥打下面的專線，會有人陪你。"
    ),
    "crisis": True,
}


def test_sec01_ac1_self_harm_question_stops_reading(provider: RecordingProvider) -> None:
    events = lines(post("reading", {**THREE, "question": "活不下去了，該怎麼辦"}).text)

    assert events == [CRISIS]
    assert provider.calls == []


def test_sec01_ac2_self_harm_follow_up_stops_reply(provider: RecordingProvider) -> None:
    events = lines(post("follow-up", follow_up_body(follow_up="我想死")).text)

    assert events == [CRISIS]
    assert provider.calls == []


# SEC-04 拒答不換模型


def test_sec04_ac1_refusal_shows_gentle_message_without_retry() -> None:
    refusing = RecordingProvider(chunks=[], error=LLMError("refusal", "declined"))
    use(refusing)

    events = lines(post("reading", THREE).text)

    assert events == [
        {
            "error": "這個問題，解讀師沒辦法用牌來回答。"
            "如果願意，可以換個方式描述你的問題，或改天再來占卜一次。"
        }
    ]
    assert len(refusing.calls) == 1
    app.dependency_overrides.clear()
