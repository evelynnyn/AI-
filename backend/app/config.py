from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_anon_key: str
    cors_origins: str = "http://localhost:3000"

    # AI reader (US-08). Keys are read only here, never sent to the frontend (SEC-03).
    llm_provider: str = "anthropic"
    anthropic_api_key: str = ""
    # Empty values fall back to the defaults in app/llm/__init__.py.
    anthropic_model: str = ""
    openai_api_key: str = ""
    openai_model: str = ""
    groq_api_key: str = ""
    groq_model: str = ""
    groq_reasoning_effort: str = ""
    mock_llm_fail: str = ""
    mock_llm_delay: float = 0.012

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
