from functools import lru_cache
from typing import Literal

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

    # Where this API is reachable from browsers; used to build links to local files.
    public_api_url: str = "http://localhost:8000"
    # "local" keeps uploads in local_storage_dir; "s3" uses any S3-compatible bucket.
    storage_backend: Literal["local", "s3"] = "local"
    local_storage_dir: str = "uploads"
    s3_bucket: str = ""
    s3_public_url: str = ""
    s3_endpoint_url: str | None = None
    s3_region: str | None = None
    s3_access_key_id: str | None = None
    s3_secret_access_key: str | None = None

    @model_validator(mode="after")
    def _require_clerk_outside_local(self) -> "Settings":
        if self.env not in ("local", "test") and not (self.clerk_issuer and self.clerk_secret_key):
            raise ValueError(
                "REXFY_CLERK_ISSUER and REXFY_CLERK_SECRET_KEY must be set outside local"
            )
        if self.storage_backend == "s3" and not (self.s3_bucket and self.s3_public_url):
            raise ValueError("REXFY_S3_BUCKET and REXFY_S3_PUBLIC_URL are required for s3")
        return self

    @property
    def clerk_jwks_url(self) -> str:
        return f"{self.clerk_issuer.rstrip('/')}/.well-known/jwks.json"


@lru_cache
def get_settings() -> Settings:
    return Settings()
