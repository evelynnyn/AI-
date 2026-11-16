"""Provider-neutral LLM interface. Services depend only on this module."""

from collections.abc import AsyncIterator
from typing import Literal, Protocol, TypedDict

LLMErrorKind = Literal["config", "rate_limit", "unavailable", "refusal", "empty", "unknown"]


class ChatMessage(TypedDict):
    role: Literal["user", "assistant"]
    content: str


class LLMError(Exception):
    """A failure the API can explain to the user in friendly words (see services/ai.py)."""

    def __init__(self, kind: LLMErrorKind, message: str) -> None:
        super().__init__(message)
        self.kind: LLMErrorKind = kind


class LLMProvider(Protocol):
    name: str

    def stream_text(self, system: str, messages: list[ChatMessage]) -> AsyncIterator[str]:
        """Yield the reply text piece by piece."""
        ...
