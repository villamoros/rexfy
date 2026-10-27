from datetime import UTC, datetime, timedelta

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.infrastructure.auth.clerk import Clerk
from app.infrastructure.db.models import User
from tests.conftest import FakeClerk, register

ISSUER = "https://rexfy-test.clerk.accounts.dev"


def test_first_request_creates_user_then_me(client: TestClient, clerk: FakeClerk) -> None:
    headers = register(client)
    response = client.get("/me", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "ana@example.com"
    assert body["full_name"] == "Ana Gómez"
    assert body["companies"] == []
    assert clerk.profile_calls == 1  # the profile is read only once


def test_existing_user_is_linked_by_email(client: TestClient, db: Session) -> None:
    db.add(User(email="ana@example.com", full_name="Ana de antes"))
    db.commit()
    body = client.get("/me", headers=register(client)).json()
    assert body["full_name"] == "Ana de antes"
    assert db.query(User).count() == 1


def test_me_requires_token(client: TestClient) -> None:
    assert client.get("/me").status_code == 401
    assert client.get("/me", headers={"Authorization": "Bearer basura"}).status_code == 401


class _Jwks:
    def __init__(self, key: rsa.RSAPrivateKey) -> None:
        self._key = key.public_key()

    def get_signing_key_from_jwt(self, token: str) -> jwt.PyJWK:
        return jwt.PyJWK.from_dict(jwt.algorithms.RSAAlgorithm.to_jwk(self._key, as_dict=True))


@pytest.fixture
def signing_key() -> rsa.RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture
def real_clerk(signing_key: rsa.RSAPrivateKey) -> Clerk:
    return Clerk(
        issuer=ISSUER,
        secret_key="sk_test_x",
        api_url="https://api.clerk.test/v1",
        authorized_parties=["http://localhost:3000"],
        jwks_client=_Jwks(signing_key),  # type: ignore[arg-type]
    )


def _token(key: rsa.RSAPrivateKey, **overrides: object) -> str:
    now = datetime.now(UTC)
    claims = {
        "sub": "user_2abc",
        "iss": ISSUER,
        "azp": "http://localhost:3000",
        "iat": now,
        "exp": now + timedelta(minutes=1),
        **overrides,
    }
    return jwt.encode(claims, key, algorithm="RS256")


def test_verify_accepts_valid_session_token(
    real_clerk: Clerk, signing_key: rsa.RSAPrivateKey
) -> None:
    assert real_clerk.verify(_token(signing_key)) == "user_2abc"


@pytest.mark.parametrize(
    "overrides",
    [
        {"iss": "https://otra.clerk.accounts.dev"},
        {"azp": "https://sitio-malicioso.com"},
        {"exp": datetime.now(UTC) - timedelta(minutes=5)},
    ],
)
def test_verify_rejects_bad_claims(
    real_clerk: Clerk, signing_key: rsa.RSAPrivateKey, overrides: dict[str, object]
) -> None:
    assert real_clerk.verify(_token(signing_key, **overrides)) is None


def test_verify_rejects_other_signing_key(real_clerk: Clerk) -> None:
    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    assert real_clerk.verify(_token(other)) is None


def test_profile_reads_primary_email(real_clerk: Clerk, monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_get(url: str, **kwargs: object) -> httpx.Response:
        assert url == "https://api.clerk.test/v1/users/user_2abc"
        assert kwargs["headers"] == {"Authorization": "Bearer sk_test_x"}
        return httpx.Response(
            200,
            json={
                "primary_email_address_id": "idn_2",
                "email_addresses": [
                    {"id": "idn_1", "email_address": "vieja@example.com"},
                    {"id": "idn_2", "email_address": "Ana@Example.com"},
                ],
                "first_name": "Ana",
                "last_name": "Gómez",
            },
            request=httpx.Request("GET", url),
        )

    monkeypatch.setattr(httpx, "get", fake_get)
    profile = real_clerk.profile("user_2abc")
    assert profile.email == "ana@example.com"
    assert profile.full_name == "Ana Gómez"
