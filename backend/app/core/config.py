from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str

    # At least one AI key must be set
    anthropic_api_key: Optional[str] = None
    anthropic_model: str = "claude-opus-4-5"

    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.0-flash"

    tavily_api_key: str

    backend_secret_key: str = "change-me"
    allowed_origins: str = "http://localhost:3000"
    port: int = 8000

    class Config:
        env_file = "../.env"
        extra = "ignore"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def ai_provider(self) -> str:
        """Returns 'anthropic' if key is set, else 'gemini', else raises."""
        if self.anthropic_api_key:
            return "anthropic"
        if self.gemini_api_key:
            return "gemini"
        raise ValueError(
            "No AI provider configured. Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
