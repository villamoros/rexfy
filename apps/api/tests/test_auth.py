from fastapi.testclient import TestClient

from tests.conftest import register


def test_register_then_me(client: TestClient) -> None:
    headers = register(client)
    response = client.get("/me", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "ana@example.com"
    assert body["companies"] == []


def test_register_duplicate_email_is_case_insensitive(client: TestClient) -> None:
    register(client)
    response = client.post(
        "/auth/register",
        json={"email": "ANA@example.com", "password": "otraclave1", "full_name": "Ana"},
    )
    assert response.status_code == 409


def test_login(client: TestClient) -> None:
    register(client)
    ok = client.post("/auth/login", json={"email": "ana@example.com", "password": "supersecreta"})
    assert ok.status_code == 200
    assert ok.json()["token_type"] == "bearer"
    bad = client.post("/auth/login", json={"email": "ana@example.com", "password": "incorrecta"})
    assert bad.status_code == 401


def test_me_requires_token(client: TestClient) -> None:
    assert client.get("/me").status_code == 401
    assert client.get("/me", headers={"Authorization": "Bearer basura"}).status_code == 401
