"""Claude via the official Anthropic SDK."""

import logging
from collections.abc import AsyncIterator

import anthropic
from anthropic.types import MessageParam

from app.llm.types import ChatMessage, LLMError, LLMErrorKind

logger = logging.getLogger(__name__)


class AnthropicProvider:
    def __init__(self, api_key: str, model: str) -> None:
        if not api_key:
            raise LLMError("config", "missing ANTHROPIC_API_KEY")
        self._client = anthropic.AsyncAnthropic(api_key=api_key)
        self._model = model
        self.name = f"anthropic:{model}"

    async def stream_text(self, system: str, messages: list[ChatMessage]) -> AsyncIterator[str]:
        params: list[MessageParam] = []
        for m in messages:
            if m["role"] == "user":
                params.append({"role": "user", "content": m["content"]})
            else:
                params.append({"role": "assistant", "content": m["content"]})
        try:
            async with self._client.messages.stream(
                model=self._model,
                max_tokens=16000,
                system=system,
                messages=params,
                # A reading is a chat-style task; medium balances quality and speed.
                output_config={"effort": "medium"},
            ) as stream:
                async for text in stream.text_stream:
                    yield text
                final = await stream.get_final_message()
        except anthropic.AuthenticationError as exc:
            raise LLMError("config", "Anthropic API key is invalid") from exc
        except anthropic.PermissionDeniedError as exc:
            raise LLMError("config", "Anthropic API key lacks permission") from exc
        except anthropic.RateLimitError as exc:
            raise LLMError("rate_limit", "Anthropic rate limit") from exc
        except anthropic.APIConnectionError as exc:
            raise LLMError("unavailable", "cannot reach Anthropic") from exc
        except anthropic.APIStatusError as exc:
            kind: LLMErrorKind = "unavailable" if exc.status_code >= 500 else "unknown"
            raise LLMError(kind, f"Anthropic API error {exc.status_code}") from exc

        # SEC-04: a refusal is respected as-is, never retried on another model.
        if final.stop_reason == "refusal":
            category = final.stop_details.category if final.stop_details else None
            logger.info("model declined (category: %s)", category)
            raise LLMError("refusal", "model declined")
