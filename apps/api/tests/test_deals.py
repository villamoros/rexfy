from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.infrastructure.db.models import Offer
from tests.conftest import company, register
from tests.test_listings import PET

Headers = dict[str, str]


@pytest.fixture
def deal(client: TestClient) -> dict[str, Any]:
    """A published PET listing (4.5 t at $850/kg), a seller and a buyer with one thread open."""
    seller = register(client, "seller@example.com")
    seller_company = company(client, seller, ["generator"], "900100200")
    listing = client.post("/listings", json={**PET, "company_id": seller_company}, headers=seller)
    listing_id = listing.json()["id"]
    client.post(f"/listings/{listing_id}/publish", headers=seller)

    buyer = register(client, "buyer@example.com")
    buyer_company = company(client, buyer, ["buyer"], "800200300")
    thread = client.post(
        "/threads",
        json={"listing_id": listing_id, "company_id": buyer_company, "body": "¿Incluye cargue?"},
        headers=buyer,
    )
    assert thread.status_code == 201, thread.text
    return {
        "seller": seller,
        "buyer": buyer,
        "seller_company": seller_company,
        "buyer_company": buyer_company,
        "listing_id": listing_id,
        "thread_id": thread.json()["id"],
    }


def offer(client: TestClient, headers: Headers, thread_id: str, **overrides: Any) -> dict:
    body = {
        "quantity": 4.5,
        "price": 820,
        "price_unit": "kg",
        "notes": "Incluye cargue",
        **overrides,
    }
    response = client.post(f"/threads/{thread_id}/offers", json=body, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()["offers"][-1]


def test_thread_visible_to_both_sides_only(client: TestClient, deal: dict[str, Any]) -> None:
    tid = deal["thread_id"]
    seller_view = client.get(f"/threads/{tid}", headers=deal["seller"]).json()
    assert seller_view["my_company_id"] == deal["seller_company"]
    assert [m["body"] for m in seller_view["messages"]] == ["¿Incluye cargue?"]

    reply = client.post(
        f"/threads/{tid}/messages", json={"body": "No, pero lo coordinamos"}, headers=deal["seller"]
    )
    assert reply.status_code == 201
    assert len(reply.json()["messages"]) == 2

    inbox = client.get("/threads", headers=deal["buyer"]).json()
    assert inbox[0]["counterpart"]["id"] == deal["seller_company"]
    assert inbox[0]["last_message"] == "No, pero lo coordinamos"

    stranger = register(client, "stranger@example.com")
    assert client.get(f"/threads/{tid}", headers=stranger).status_code == 404
    assert client.get("/threads", headers=stranger).json() == []


def test_starting_again_reuses_thread(client: TestClient, deal: dict[str, Any]) -> None:
    again = client.post(
        "/threads",
        json={
            "listing_id": deal["listing_id"],
            "company_id": deal["buyer_company"],
            "body": "Hola",
        },
        headers=deal["buyer"],
    )
    assert again.json()["id"] == deal["thread_id"]
    assert len(again.json()["messages"]) == 2


def test_only_buyer_companies_can_start(client: TestClient, deal: dict[str, Any]) -> None:
    own = client.post(
        "/threads",
        json={"listing_id": deal["listing_id"], "company_id": deal["seller_company"], "body": "x"},
        headers=deal["seller"],
    )
    assert own.status_code == 403


def test_counter_then_accept_creates_order(client: TestClient, deal: dict[str, Any]) -> None:
    tid = deal["thread_id"]
    first = offer(client, deal["seller"], tid)
    assert first["total"] == 3_690_000

    # The sender cannot accept their own quote, nor send a second one while it is pending.
    assert client.post(f"/offers/{first['id']}/accept", headers=deal["seller"]).status_code == 403
    dup = client.post(
        f"/threads/{tid}/offers",
        json={"quantity": 1, "price": 1, "price_unit": "kg"},
        headers=deal["seller"],
    )
    assert dup.status_code == 409

    counter = offer(client, deal["buyer"], tid, price=800, notes=None)
    statuses = [
        o["status"] for o in client.get(f"/threads/{tid}", headers=deal["buyer"]).json()["offers"]
    ]
    assert statuses == ["countered", "pending"]
    assert client.post(f"/offers/{first['id']}/accept", headers=deal["buyer"]).status_code == 409

    accepted = client.post(f"/offers/{counter['id']}/accept", headers=deal["seller"])
    assert accepted.status_code == 200, accepted.text
    order = accepted.json()
    assert order["code"].startswith("ORD-")
    assert order["status"] == "agreed"
    assert order["total"] == 3_600_000
    assert order["my_role"] == "seller"
    assert order["thread_id"] == tid

    assert (
        client.get(f"/threads/{tid}", headers=deal["buyer"]).json()["transaction_id"] == order["id"]
    )
    buyer_orders = client.get("/transactions", headers=deal["buyer"]).json()
    assert [(o["id"], o["my_role"]) for o in buyer_orders] == [(order["id"], "buyer")]


def test_decline_and_quantity_limit(client: TestClient, deal: dict[str, Any]) -> None:
    tid = deal["thread_id"]
    too_much = client.post(
        f"/threads/{tid}/offers",
        json={"quantity": 10, "price": 800, "price_unit": "kg"},
        headers=deal["seller"],
    )
    assert too_much.status_code == 409
    quote = offer(client, deal["seller"], tid)
    declined = client.post(f"/offers/{quote['id']}/decline", headers=deal["buyer"])
    assert declined.json()["status"] == "declined"
    assert client.post(f"/offers/{quote['id']}/accept", headers=deal["buyer"]).status_code == 409


def test_expired_offer_cannot_be_accepted(
    client: TestClient, db: Session, deal: dict[str, Any]
) -> None:
    quote = offer(client, deal["seller"], deal["thread_id"], valid_hours=1)
    db.get(Offer, quote["id"]).valid_until = datetime.now(UTC) - timedelta(minutes=1)
    db.commit()
    assert client.post(f"/offers/{quote['id']}/accept", headers=deal["buyer"]).status_code == 409
    thread = client.get(f"/threads/{deal['thread_id']}", headers=deal["buyer"]).json()
    assert thread["offers"][0]["status"] == "declined"


def test_buyer_confirms_receipt(client: TestClient, deal: dict[str, Any]) -> None:
    quote = offer(client, deal["seller"], deal["thread_id"])
    order = client.post(f"/offers/{quote['id']}/accept", headers=deal["buyer"]).json()
    path = f"/transactions/{order['id']}/confirm-receipt"
    assert client.post(path, headers=deal["seller"]).status_code == 403
    done = client.post(path, headers=deal["buyer"])
    assert done.json()["status"] == "completed"
    assert client.post(path, headers=deal["buyer"]).status_code == 409
    stranger = register(client, "stranger@example.com")
    assert client.get(f"/transactions/{order['id']}", headers=stranger).status_code == 404


def _second_buyer(client: TestClient, listing_id: str) -> tuple[Headers, str]:
    buyer = register(client, "buyer2@example.com")
    buyer_company = company(client, buyer, ["buyer"], "800200311")
    thread = client.post(
        "/threads",
        json={"listing_id": listing_id, "company_id": buyer_company, "body": "Me interesa"},
        headers=buyer,
    )
    return buyer, thread.json()["id"]


def test_one_off_listing_cannot_be_oversold(client: TestClient, deal: dict[str, Any]) -> None:
    lid = deal["listing_id"]
    client.patch(f"/listings/{lid}", json={"is_recurring": False}, headers=deal["seller"])
    other, other_thread = _second_buyer(client, lid)
    first = offer(client, deal["seller"], deal["thread_id"], quantity=3)
    second = offer(client, deal["seller"], other_thread, quantity=3)

    assert client.post(f"/offers/{first['id']}/accept", headers=deal["buyer"]).status_code == 200
    listing = client.get(f"/listings/{lid}", headers=deal["seller"]).json()
    assert listing["quantity"] == 1.5
    assert listing["status"] == "published"

    # 3 t no longer fit in the 1.5 t left.
    late = client.post(f"/offers/{second['id']}/accept", headers=other)
    assert late.status_code == 409

    # The buyer counters with what is left, and the seller accepts.
    rest = offer(client, other, other_thread, quantity=1.5)
    assert client.post(f"/offers/{rest['id']}/accept", headers=deal["seller"]).status_code == 200
    sold_out = client.get(f"/listings/{lid}", headers=deal["seller"]).json()
    assert sold_out["status"] == "archived"
    assert sold_out["quantity"] == 0


def test_recurring_listing_keeps_its_quantity(client: TestClient, deal: dict[str, Any]) -> None:
    quote = offer(client, deal["seller"], deal["thread_id"], quantity=4.5)
    assert client.post(f"/offers/{quote['id']}/accept", headers=deal["buyer"]).status_code == 200
    listing = client.get(f"/listings/{deal['listing_id']}").json()
    assert listing["quantity"] == 4.5
    assert listing["status"] == "published"


def test_archived_listing_cannot_close_deals(client: TestClient, deal: dict[str, Any]) -> None:
    quote = offer(client, deal["seller"], deal["thread_id"])
    client.post(f"/listings/{deal['listing_id']}/archive", headers=deal["seller"])
    accepted = client.post(f"/offers/{quote['id']}/accept", headers=deal["buyer"])
    assert accepted.status_code == 409
    new_quote = client.post(
        f"/threads/{deal['thread_id']}/offers",
        json={"quantity": 1, "price": 800, "price_unit": "kg"},
        headers=deal["buyer"],
    )
    assert new_quote.status_code == 409
