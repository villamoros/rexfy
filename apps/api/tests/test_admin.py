from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.db.models import User
from tests.conftest import company, register
from tests.test_deals import deal, offer  # noqa: F401  (fixture)

Headers = dict[str, str]


@pytest.fixture
def admin(client: TestClient, db: Session) -> Headers:
    headers = register(client, "equipo@rexfy.co")
    db.scalar(select(User).where(User.email == "equipo@rexfy.co")).is_platform_admin = True
    db.commit()
    return headers


def test_only_admins_reach_admin_endpoints(client: TestClient) -> None:
    user = register(client, "ana@example.com")
    assert client.get("/admin/companies", headers=user).status_code == 403
    assert client.get("/admin/audit", headers=user).status_code == 403


def test_verify_company(client: TestClient, admin: Headers) -> None:
    owner = register(client, "ana@example.com")
    company_id = company(client, owner, ["buyer"], "900100200")
    queue = client.get("/admin/companies", params={"verified": False}, headers=admin).json()
    assert [(c["id"], c["members"]) for c in queue] == [(company_id, 1)]
    assert client.get("/me", headers=owner).json()["companies"][0]["is_verified"] is False

    done = client.post(f"/admin/companies/{company_id}/verify", headers=admin)
    assert done.json()["is_verified"] is True
    assert client.get("/me", headers=owner).json()["companies"][0]["is_verified"] is True
    assert client.get("/admin/companies", params={"verified": False}, headers=admin).json() == []

    log = client.get("/admin/audit", params={"entity_id": company_id}, headers=admin).json()
    assert [e["action"] for e in log] == ["company.verified", "company.created"]
    assert log[0]["actor_name"] == "Ana Gómez"


def test_take_down_listing(client: TestClient, admin: Headers, deal: dict[str, Any]) -> None:  # noqa: F811
    lid = deal["listing_id"]
    down = client.post(
        f"/admin/listings/{lid}/take-down",
        json={"reason": "Fotos de otro proveedor"},
        headers=admin,
    )
    assert down.status_code == 200
    assert down.json()["status"] == "archived"
    assert client.get(f"/listings/{lid}").status_code == 404
    own = client.get(f"/listings/{lid}", headers=deal["seller"]).json()
    assert own["moderation_note"] == "Fotos de otro proveedor"


def test_critical_actions_are_audited(
    client: TestClient,
    admin: Headers,
    deal: dict[str, Any],  # noqa: F811
) -> None:
    quote = offer(client, deal["seller"], deal["thread_id"])
    client.post(f"/offers/{quote['id']}/accept", headers=deal["buyer"])
    log = client.get("/admin/audit", params={"entity_id": quote["id"]}, headers=admin).json()
    assert [e["action"] for e in log] == ["offer.accepted", "offer.sent"]
    assert log[0]["company_id"] == deal["buyer_company"]
    assert log[0]["data"]["total"] == "3690000.00"

    listing_log = client.get(
        "/admin/audit", params={"entity_id": deal["listing_id"]}, headers=admin
    ).json()
    assert [e["action"] for e in listing_log] == ["listing.published", "listing.created"]
