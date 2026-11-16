"""Fake provider for development and tests (LLM_PROVIDER=mock): no network, no cost.

MOCK_LLM_FAIL=1 drops the connection mid-reply; MOCK_LLM_FAIL=refusal simulates a refusal.
"""

import asyncio
from collections.abc import AsyncIterator

from app.llm.types import ChatMessage, LLMError

SUGGESTIONS_JSON = '["我該主動一點嗎？","這張逆位怎麼看？","多久會有變化？"]'


class MockProvider:
    name = "mock"

    def __init__(self, fail: str = "", delay: float = 0.0) -> None:
        self._fail = fail
        self._delay = delay

    async def stream_text(self, system: str, messages: list[ChatMessage]) -> AsyncIterator[str]:
        if self._fail == "refusal":
            raise LLMError("refusal", "mock refusal")
        if "JSON 陣列" in system:
            yield SUGGESTIONS_JSON
            return

        last = messages[-1]["content"]
        if len(messages) > 1:
            question = last.split("\n")[0]
            text = f"（測試用的假回答）你問「{question}」。先照顧好自己的節奏，再踏出下一步。"
        else:
            text = (
                "（這是測試用的假解讀，沒有呼叫真正的 AI。）\n\n"
                "第一張牌提醒你回頭看看來時的路。\n\n綜合來看，這組牌希望你相信自己的步調。"
            )
        for char in text:
            if self._fail == "1" and char == "綜":
                raise LLMError("unavailable", "mock failure")
            if self._delay:
                await asyncio.sleep(self._delay)
            yield char
