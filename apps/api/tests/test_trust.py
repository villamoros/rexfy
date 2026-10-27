from decimal import Decimal
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.domain.trust.score import trust_score
from tests.test_admin import admin  # noqa: F401  (fixture)
from tests.test_deals import deal, offer  # noqa: F401  (fixture)

Headers = dict[str, str]


@pytest.fixture
def order(client: TestClient, deal: dict[str, Any]) -> dict[str, Any]:  # noqa: F811
    quote = offer(client, deal["seller"], deal["thread_id"])
    accepted = client.post(f"/offers/{quote['id']}/accept", headers=deal["buyer"])
    return {**deal, "order_id": accepted.json()["id"]}


def _review(client: TestClient, headers: Headers, order_id: str, rating: int, comment=None):
    return client.post(
        f"/transactions/{order_id}/reviews",
        json={"rating": rating, "comment": comment},
        headers=headers,
    )


def test_reviews_after_closing(client: TestClient, order: dict[str, Any]) -> None:
    oid = order["order_id"]
    assert _review(client, order["buyer"], oid, 5).status_code == 409  # still open

    client.post(f"/transactions/{oid}/confirm-receipt", headers=order["buyer"])
    done = _review(client, order["buyer"], oid, 4, "  Material limpio, buen cargue ")
    assert done.status_code == 201, done.text
    assert done.json()["comment"] == "Material limpio, buen cargue"
    assert _review(client, order["buyer"], oid, 1).status_code == 409  # once per side
    assert _review(client, order["seller"], oid, 5).status_code == 201

    detail = client.get(f"/transactions/{oid}", headers=order["buyer"]).json()
    assert detail["reviewed_by_me"] is True

    profile = client.get(f"/companies/{order['seller_company']}/profile").json()
    assert profile["review_count"] == 1
    assert profile["average_rating"] == 4.0
    assert profile["completed_orders"] == 1
    assert profile["reviews"][0]["from_company"]["id"] == order["buyer_company"]
    assert [i["id"] for i in profile["listings"]] == [order["listing_id"]]
    # Unverified, one 4-star review, one order: 0 + 30 * 1/5 + 2.
    assert profile["trust_score"] == 8


def test_dispute_blocks_closing_until_resolved(
    client: TestClient,
    admin: Headers,  # noqa: F811
    order: dict[str, Any],
) -> None:
    oid = order["order_id"]
    opened = client.post(
        f"/transactions/{oid}/disputes",
        json={"reason": "quantity", "description": "Llegaron 3,8 t de las 4,5 t acordadas"},
        headers=order["buyer"],
    )
    assert opened.status_code == 201, opened.text
    did = opened.json()["id"]
    again = client.post(
        f"/transactions/{oid}/disputes",
        json={"reason": "other", "description": "Otra cosa distinta"},
        headers=order["seller"],
    )
    assert again.status_code == 409
    assert client.get(f"/transactions/{oid}", headers=order["seller"]).json()["has_open_dispute"]
    closing = client.post(f"/transactions/{oid}/confirm-receipt", headers=order["buyer"])
    assert closing.status_code == 409

    queue = client.get("/admin/disputes", params={"status": "open"}, headers=admin).json()
    assert [d["id"] for d in queue] == [did]
    assert client.patch(
        f"/admin/disputes/{did}", json={"resolution": "Corto"}, headers=order["buyer"]
    ).status_code in (403, 422)
    resolved = client.patch(
        f"/admin/disputes/{did}",
        json={
            "resolution": "El vendedor reconoce el faltante y descuenta 0,7 t",
            "at_fault_company_id": order["seller_company"],
        },
        headers=admin,
    )
    assert resolved.status_code == 200, resolved.text
    assert resolved.json()["status"] == "resolved"

    assert client.post(f"/transactions/{oid}/confirm-receipt", headers=order["buyer"]).json()[
        "status"
    ] == ("completed")
    history = client.get(f"/transactions/{oid}/disputes", headers=order["seller"]).json()
    assert history[0]["resolution"].startswith("El vendedor")
    profile = client.get(f"/companies/{order['seller_company']}/profile").json()
    assert profile["trust_score"] == 0  # 2 for the order, minus 10 for the lost dispute


def test_outsiders_cannot_review_or_dispute(client: TestClient, order: dict[str, Any]) -> None:
    from tests.conftest import register

    stranger = register(client, "stranger@example.com")
    oid = order["order_id"]
    assert _review(client, stranger, oid, 1).status_code == 404
    dispute = client.post(
        f"/transactions/{oid}/disputes",
        json={"reason": "other", "description": "No tengo nada que ver"},
        headers=stranger,
    )
    assert dispute.status_code == 404
    assert client.get("/companies/00000000-0000-0000-0000-000000000000/profile").status_code == 404


def test_trust_score() -> None:
    assert (
        trust_score(is_verified=False, average_rating=None, review_count=0, completed_orders=0) == 0
    )
    assert (
        trust_score(
            is_verified=True, average_rating=Decimal(5), review_count=12, completed_orders=30
        )
        == 100
    )
    # One perfect review counts for a fifth of the rating points.
    assert (
        trust_score(is_verified=True, average_rating=Decimal(5), review_count=1, completed_orders=0)
        == 48
    )
