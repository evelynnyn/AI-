"""Pick the LLM provider from settings (LLM_PROVIDER). Server-side only: keys never leave here."""

from app.config import Settings
from app.llm.anthropic_provider import AnthropicProvider
from app.llm.mock_provider import MockProvider
from app.llm.openai_provider import OpenAICompatibleProvider, ReasoningEffort
from app.llm.types import ChatMessage, LLMError, LLMErrorKind, LLMProvider

__all__ = ["ChatMessage", "LLMError", "LLMErrorKind", "LLMProvider", "get_provider"]

ANTHROPIC_DEFAULT_MODEL = "claude-sonnet-5-5"

# Groq's free tier allows 8000 tokens a minute; low reasoning keeps one reading well inside it.
GROQ_DEFAULT_MODEL = "openai/gpt-oss-120b"
GROQ_MAX_OUTPUT_TOKENS = 4000
REASONING_EFFORTS: dict[str, ReasoningEffort] = {"low": "low", "medium": "medium", "high": "high"}


def get_provider(settings: Settings) -> LLMProvider:
    name = settings.llm_provider.lower()
    if name == "anthropic":
        model = settings.anthropic_model or ANTHROPIC_DEFAULT_MODEL
        return AnthropicProvider(settings.anthropic_api_key, model)
    if name == "openai":
        return OpenAICompatibleProvider(
            label="openai", api_key=settings.openai_api_key, model=settings.openai_model
        )
    if name == "groq":
        model = settings.groq_model or GROQ_DEFAULT_MODEL
        # Only gpt-oss accepts a reasoning effort; other models reject the parameter.
        effort: ReasoningEffort | None = (
            REASONING_EFFORTS.get(settings.groq_reasoning_effort.lower(), "low")
            if model.startswith("openai/gpt-oss")
            else None
        )
        return OpenAICompatibleProvider(
            label="groq",
            api_key=settings.groq_api_key,
            model=model,
            base_url="https://api.groq.com/openai/v1",
            reasoning_effort=effort,
            max_output_tokens=GROQ_MAX_OUTPUT_TOKENS,
        )
    if name == "mock":
        return MockProvider(fail=settings.mock_llm_fail, delay=settings.mock_llm_delay)
    raise LLMError("config", f"unsupported LLM_PROVIDER: {name}")
