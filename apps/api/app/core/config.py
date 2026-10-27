from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="REXFY_", extra="ignore")

    env: str = "local"
    database_url: str = "postgresql+psycopg://rexfy:rexfy@localhost:5432/rexfy"
    redis_url: str = "redis://localhost:6379/0"
    cors_origins: list[str] = ["http://localhost:3000"]
    # Clerk instance that issues session tokens, e.g. https://<slug>.clerk.accounts.dev
    clerk_issuer: str = ""
    # Backend API key, used once per new user to read their email and name.
    clerk_secret_key: str = ""
    clerk_api_url: str = "https://api.clerk.com/v1"
    # Origins allowed in the token's `azp` claim; defaults to cors_origins.
    clerk_authorized_parties: list[str] | None = None

    @model_validator(mode="after")
    def _require_clerk_outside_local(self) -> "Settings":
        if self.env not in ("local", "test") and not (self.clerk_issuer and self.clerk_secret_key):
            raise ValueError(
                "REXFY_CLERK_ISSUER and REXFY_CLERK_SECRET_KEY must be set outside local"
            )
        return self

    @property
    def clerk_jwks_url(self) -> str:
        return f"{self.clerk_issuer.rstrip('/')}/.well-known/jwks.json"


@lru_cache
def get_settings() -> Settings:
    return Settings()
