from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

LOCAL_JWT_SECRET = "local-dev-secret-not-for-production-use"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="REXFY_", extra="ignore")

    env: str = "local"
    database_url: str = "postgresql+psycopg://rexfy:rexfy@localhost:5432/rexfy"
    redis_url: str = "redis://localhost:6379/0"
    cors_origins: list[str] = ["http://localhost:3000"]
    jwt_secret: str = LOCAL_JWT_SECRET
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60 * 24

    @model_validator(mode="after")
    def _require_real_secret_outside_local(self) -> "Settings":
        if self.env not in ("local", "test") and self.jwt_secret == LOCAL_JWT_SECRET:
            raise ValueError("REXFY_JWT_SECRET must be set outside local development")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
