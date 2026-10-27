from typing import Any

import pytest
from fastapi.testclient import TestClient

from tests.conftest import company, register
from tests.test_deals import deal, offer  # noqa: F401  (fixture)

REQUEST = {
    "pickup_city": "Bogotá D.C.",
    "pickup_address": "Planta Fontibón, Calle 17 # 100-20",
    "delivery_city": "Medellín",
    "delivery_address": "Bodega Itagüí, Carrera 50 # 30-10",
    "vehicle_type": "single_truck",
    "pickup_date": "2026-11-18",
}


@pytest.fixture
def order(client: TestClient, deal: dict[str, Any]) -> dict[str, Any]:  # noqa: F811
    quote = offer(client, deal["seller"], deal["thread_id"])
    accepted = client.post(f"/offers/{quote['id']}/accept", headers=deal["buyer"])
    return {**deal, "order_id": accepted.json()["id"]}


def transporter(client: TestClient, email: str, base: str) -> tuple[dict[str, str], str]:
    headers = register(client, email)
    return headers, company(client, headers, ["transporter"], base)


def bid(client: TestClient, headers: dict[str, str], shipment_id: str, company_id: str, price: int):
    return client.post(
        f"/shipments/{shipment_id}/quotes",
        json={
            "company_id": company_id,
            "price": price,
            "pickup_date": "2026-11-18",
            "delivery_date": "2026-11-19",
            "includes_insurance": price > 1_700_000,
        },
        headers=headers,
    )


def test_full_logistics_flow(client: TestClient, order: dict[str, Any]) -> None:
    oid = order["order_id"]
    created = client.post(f"/transactions/{oid}/shipment", json=REQUEST, headers=order["buyer"])
    assert created.status_code == 201, created.text
    shipment = created.json()
    sid = shipment["id"]
    assert shipment["status"] == "requested"
    assert shipment["my_relation"] == "party"
    again = client.post(f"/transactions/{oid}/shipment", json=REQUEST, headers=order["seller"])
    assert again.status_code == 409

    andina, andina_co = transporter(client, "andina@example.com", "811000111")
    logicol, logicol_co = transporter(client, "logicol@example.com", "811000222")

    # Transporters see open requests by city, without the exact addresses.
    open_view = client.get("/logistics/requests", headers=andina).json()
    assert [s["id"] for s in open_view] == [sid]
    assert open_view[0]["pickup_address"] is None
    assert client.get("/logistics/requests", headers=order["buyer"]).status_code == 403

    assert bid(client, andina, sid, andina_co, 1_850_000).status_code == 201
    assert bid(client, andina, sid, andina_co, 1_800_000).status_code == 409
    assert bid(client, logicol, sid, andina_co, 1_000_000).status_code == 403
    assert bid(client, logicol, sid, logicol_co, 1_620_000).status_code == 201

    # Each bidder sees only its own quote; the parties see all, cheapest first.
    assert len(client.get(f"/shipments/{sid}", headers=logicol).json()["quotes"]) == 1
    quotes = client.get(f"/transactions/{oid}/shipment", headers=order["seller"]).json()["quotes"]
    assert [q["price"] for q in quotes] == [1_620_000, 1_850_000]

    andina_quote = next(q for q in quotes if q["transporter"]["id"] == andina_co)
    assert (
        client.post(f"/transport-quotes/{andina_quote['id']}/accept", headers=andina).status_code
        == 403
    )
    assigned = client.post(f"/transport-quotes/{andina_quote['id']}/accept", headers=order["buyer"])
    assert assigned.status_code == 200, assigned.text
    assert assigned.json()["status"] == "assigned"
    assert assigned.json()["transporter"]["id"] == andina_co

    # The losing bidder loses access; the winner now sees the addresses.
    assert client.get(f"/shipments/{sid}", headers=logicol).status_code == 404
    winner_view = client.get(f"/shipments/{sid}", headers=andina).json()
    assert winner_view["pickup_address"] == REQUEST["pickup_address"]
    assert [s["id"] for s in client.get("/logistics/shipments", headers=andina).json()] == [sid]
    assert client.get("/logistics/requests", headers=andina).json() == []

    events = f"/shipments/{sid}/events"
    assert (
        client.post(events, json={"status": "picked_up"}, headers=order["buyer"]).status_code == 403
    )
    assert (
        client.post(
            events, json={"status": "picked_up", "note": "Placa HJK 492"}, headers=andina
        ).status_code
        == 201
    )
    assert (
        client.get(f"/transactions/{oid}", headers=order["buyer"]).json()["status"] == "in_transit"
    )
    assert client.post(events, json={"status": "assigned"}, headers=andina).status_code == 409
    done = client.post(events, json={"status": "delivered"}, headers=andina)
    assert [e["status"] for e in done.json()["events"]] == [
        "requested",
        "assigned",
        "picked_up",
        "delivered",
    ]
    assert (
        client.get(f"/transactions/{oid}", headers=order["buyer"]).json()["status"] == "delivered"
    )

    closed = client.post(f"/transactions/{oid}/confirm-receipt", headers=order["buyer"])
    assert closed.json()["status"] == "completed"


def test_outsiders_cannot_request_or_view(client: TestClient, order: dict[str, Any]) -> None:
    oid = order["order_id"]
    stranger = register(client, "stranger@example.com")
    assert (
        client.post(f"/transactions/{oid}/shipment", json=REQUEST, headers=stranger).status_code
        == 404
    )
    assert client.get(f"/transactions/{oid}/shipment", headers=order["buyer"]).status_code == 404


def test_delivery_before_pickup_is_rejected(client: TestClient, order: dict[str, Any]) -> None:
    sid = client.post(
        f"/transactions/{order['order_id']}/shipment", json=REQUEST, headers=order["buyer"]
    ).json()["id"]
    headers, company_id = transporter(client, "andina@example.com", "811000111")
    late = client.post(
        f"/shipments/{sid}/quotes",
        json={
            "company_id": company_id,
            "price": 1,
            "pickup_date": "2026-11-18",
            "delivery_date": "2026-11-17",
        },
        headers=headers,
    )
    assert late.status_code == 409


def test_shipment_order_is_enforced(client: TestClient, order: dict[str, Any]) -> None:
    oid = order["order_id"]
    sid = client.post(f"/transactions/{oid}/shipment", json=REQUEST, headers=order["buyer"]).json()[
        "id"
    ]
    headers, company_id = transporter(client, "andina@example.com", "811000111")
    quote = bid(client, headers, sid, company_id, 1_500_000).json()["quotes"][0]
    client.post(f"/transport-quotes/{quote['id']}/accept", headers=order["buyer"])

    confirm = f"/transactions/{oid}/confirm-receipt"
    events = f"/shipments/{sid}/events"
    # Nothing is delivered before pickup, and the buyer waits for the delivery.
    assert client.post(events, json={"status": "delivered"}, headers=headers).status_code == 409
    assert client.post(confirm, headers=order["buyer"]).status_code == 409
    assert client.post(events, json={"status": "picked_up"}, headers=headers).status_code == 201
    assert client.post(confirm, headers=order["buyer"]).status_code == 409
    assert client.post(events, json={"status": "delivered"}, headers=headers).status_code == 201
    assert client.post(confirm, headers=order["buyer"]).json()["status"] == "completed"
