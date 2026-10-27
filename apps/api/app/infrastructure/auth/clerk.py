"""Clerk adapter: verifies session tokens and reads user profiles."""

from dataclasses import dataclass
from functools import lru_cache

import httpx
import jwt

from app.core.config import get_settings


@dataclass(frozen=True)
class Profile:
    email: str
    full_name: str


class ClerkUnavailable(Exception):
    pass


class Clerk:
    def __init__(
        self,
        *,
        issuer: str,
        secret_key: str,
        api_url: str,
        authorized_parties: list[str],
        jwks_client: jwt.PyJWKClient,
    ) -> None:
        self._issuer = issuer.rstrip("/")
        self._secret_key = secret_key
        self._api_url = api_url.rstrip("/")
        self._authorized_parties = authorized_parties
        self._jwks = jwks_client

    def verify(self, token: str) -> str | None:
        """The Clerk user id (`sub`) of a valid session token, or None."""
        try:
            key = self._jwks.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                key.key,
                algorithms=["RS256"],
                issuer=self._issuer,
                options={"require": ["sub", "exp", "iat"]},
                leeway=5,
            )
        except jwt.PyJWTError:
            return None
        azp = claims.get("azp")
        if azp and self._authorized_parties and azp not in self._authorized_parties:
            return None
        return claims["sub"]

    def profile(self, clerk_user_id: str) -> Profile:
        try:
            response = httpx.get(
                f"{self._api_url}/users/{clerk_user_id}",
                headers={"Authorization": f"Bearer {self._secret_key}"},
                timeout=10,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise ClerkUnavailable from exc
        data = response.json()
        emails = {e["id"]: e["email_address"] for e in data.get("email_addresses", [])}
        email = emails.get(data.get("primary_email_address_id")) or next(iter(emails.values()), "")
        name = " ".join(p for p in (data.get("first_name"), data.get("last_name")) if p)
        return Profile(email=email.lower(), full_name=name or email.split("@")[0])


@lru_cache
def get_clerk() -> Clerk:
    settings = get_settings()
    return Clerk(
        issuer=settings.clerk_issuer,
        secret_key=settings.clerk_secret_key,
        api_url=settings.clerk_api_url,
        authorized_parties=settings.clerk_authorized_parties or settings.cors_origins,
        jwks_client=jwt.PyJWKClient(settings.clerk_jwks_url, cache_keys=True),
    )
