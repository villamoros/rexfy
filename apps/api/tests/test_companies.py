from fastapi.testclient import TestClient

from tests.conftest import register

COMPANY = {
    "legal_name": "Cartones del Valle SAS",
    "nit": "890.903.938-8",
    "city": "Cali",
    "market_roles": ["generator", "buyer"],
}


def test_create_company_makes_user_owner(client: TestClient) -> None:
    headers = register(client)
    response = client.post("/companies", json=COMPANY, headers=headers)
    assert response.status_code == 201, response.text
    company = response.json()
    assert company["nit"] == "890903938-8"
    assert company["is_verified"] is False

    me = client.get("/me", headers=headers).json()
    assert me["companies"] == [
        {
            "company_id": company["id"],
            "legal_name": "Cartones del Valle SAS",
            "market_roles": ["buyer", "generator"],
            "is_verified": False,
            "role": "owner",
        }
    ]

    fetched = client.get(f"/companies/{company['id']}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["legal_name"] == "Cartones del Valle SAS"


def test_duplicate_nit_conflicts(client: TestClient) -> None:
    client.post("/companies", json=COMPANY, headers=register(client))
    other = register(client, "luis@example.com")
    assert client.post("/companies", json=COMPANY, headers=other).status_code == 409


def test_invalid_nit_and_empty_roles_are_rejected(client: TestClient) -> None:
    headers = register(client)
    bad_nit = client.post("/companies", json={**COMPANY, "nit": "890903938-1"}, headers=headers)
    assert bad_nit.status_code == 422
    no_roles = client.post("/companies", json={**COMPANY, "market_roles": []}, headers=headers)
    assert no_roles.status_code == 422


def test_create_company_requires_auth(client: TestClient) -> None:
    assert client.post("/companies", json=COMPANY).status_code == 401
