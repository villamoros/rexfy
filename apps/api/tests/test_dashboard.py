from typing import Any

from fastapi.testclient import TestClient

from tests.test_admin import admin  # noqa: F401  (fixture)
from tests.test_deals import deal, offer  # noqa: F401  (fixture)


def test_role_kpis(client: TestClient, deal: dict[str, Any]) -> None:  # noqa: F811
    client.post(
        f"/threads/{deal['thread_id']}/messages", json={"body": "Sí"}, headers=deal["seller"]
    )
    seller = client.get("/me/dashboard", headers=deal["seller"]).json()[0]
    assert seller["buyer"] is None
    assert seller["seller"]["active_listings"] == 1
    assert seller["seller"]["leads_30d"] == 1
    assert seller["seller"]["avg_first_reply_hours"] == 0.0
    buyer = client.get("/me/dashboard", headers=deal["buyer"]).json()[0]
    assert buyer["buyer"]["open_negotiations"] == 1

    quote = offer(client, deal["seller"], deal["thread_id"])  # 4.5 t at $820/kg
    client.post(f"/offers/{quote['id']}/accept", headers=deal["buyer"])
    seller = client.get("/me/dashboard", headers=deal["seller"]).json()[0]["seller"]
    assert (seller["orders"], seller["tons_sold"], seller["revenue"]) == (1, 4.5, 3_690_000)
    buyer = client.get("/me/dashboard", headers=deal["buyer"]).json()[0]["buyer"]
    assert buyer["open_negotiations"] == 0
    assert (buyer["orders"], buyer["tons_bought"], buyer["spend"]) == (1, 4.5, 3_690_000)
    assert buyer["avg_days_to_secure"] == 0.0


def test_platform_kpis(
    client: TestClient,
    admin: dict[str, str],  # noqa: F811
    deal: dict[str, Any],  # noqa: F811
) -> None:
    quote = offer(client, deal["seller"], deal["thread_id"])
    order = client.post(f"/offers/{quote['id']}/accept", headers=deal["buyer"]).json()
    client.post(f"/transactions/{order['id']}/confirm-receipt", headers=deal["buyer"])
    metrics = client.get("/admin/metrics", headers=admin).json()
    assert metrics["tons_reused"] == 4.5
    assert metrics["gmv_30d"] == 3_690_000
    assert metrics["completed_rate"] == 1.0
    assert metrics["listings_published_30d"] == 1
    assert metrics["companies_pending_verification"] == 2
    assert metrics["open_disputes"] == 0
    assert client.get("/admin/metrics", headers=deal["buyer"]).status_code == 403
