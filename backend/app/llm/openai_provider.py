"""Providers that speak the OpenAI Chat Completions format (OpenAI, Groq)."""

import logging
from collections.abc import AsyncIterator
from typing import Literal

import openai
from openai.types.chat import ChatCompletionMessageParam

from app.llm.types import ChatMessage, LLMError, LLMErrorKind

logger = logging.getLogger(__name__)

ReasoningEffort = Literal["low", "medium", "high"]


class OpenAICompatibleProvider:
    def __init__(
        self,
        *,
        label: str,
        api_key: str,
        model: str,
        base_url: str | None = None,
        reasoning_effort: ReasoningEffort | None = None,
        max_output_tokens: int = 16000,
    ) -> None:
        env = label.upper()
        if not api_key:
            raise LLMError("config", f"missing {env}_API_KEY")
        if not model:
            raise LLMError("config", f"{env}_MODEL is required for {label}")
        self._client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)
        self._label = label
        self._model = model
        self._reasoning_effort = reasoning_effort
        self._max_output_tokens = max_output_tokens
        self.name = f"{label}:{model}"

    async def stream_text(self, system: str, messages: list[ChatMessage]) -> AsyncIterator[str]:
        params: list[ChatCompletionMessageParam] = [{"role": "system", "content": system}]
        for m in messages:
            if m["role"] == "user":
                params.append({"role": "user", "content": m["content"]})
            else:
                params.append({"role": "assistant", "content": m["content"]})
        # Reasoning models sometimes produce only reasoning and no reply text; retry once.
        for attempt in (1, 2):
            produced = False
            try:
                stream = await self._client.chat.completions.create(
                    model=self._model,
                    stream=True,
                    max_completion_tokens=self._max_output_tokens,
                    messages=params,
                    stream_options={"include_usage": True},
                    reasoning_effort=self._reasoning_effort or openai.omit,
                )
                async for chunk in stream:
                    if chunk.usage:
                        logger.info(
                            "%s tokens: in %s, out %s",
                            self.name,
                            chunk.usage.prompt_tokens,
                            chunk.usage.completion_tokens,
                        )
                    text = chunk.choices[0].delta.content if chunk.choices else None
                    if text:
                        produced = True
                        yield text
            except openai.AuthenticationError as exc:
                raise LLMError("config", f"{self._label} API key is invalid") from exc
            except openai.PermissionDeniedError as exc:
                raise LLMError("config", f"{self._label} API key lacks permission") from exc
            except openai.RateLimitError as exc:
                raise LLMError("rate_limit", f"{self._label} rate limit") from exc
            except openai.APIConnectionError as exc:
                raise LLMError("unavailable", f"cannot reach {self._label}") from exc
            except openai.APIStatusError as exc:
                kind: LLMErrorKind = "unavailable" if exc.status_code >= 500 else "unknown"
                raise LLMError(kind, f"{self._label} API error {exc.status_code}") from exc
            if produced:
                return
            logger.warning("%s returned no text (attempt %s)", self.name, attempt)
        raise LLMError("empty", f"{self._label} returned no text twice")
