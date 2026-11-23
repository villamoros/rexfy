import uuid
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application import analytics
from app.domain.product.events import ProductEventName
from app.infrastructure.db.models import ProductEvent, User
from tests.conftest import register
from tests.test_admin import admin  # noqa: F401  (fixture)
from tests.test_deals import deal, offer  # noqa: F401  (fixture)


def test_funnel_reconciles_the_commercial_transaction(
    client: TestClient,
    db: Session,
    admin: dict[str, str],  # noqa: F811
    deal: dict[str, Any],  # noqa: F811
) -> None:
    quote = offer(client, deal["seller"], deal["thread_id"])
    order = client.post(f"/offers/{quote['id']}/accept", headers=deal["buyer"])
    assert order.status_code == 200

    response = client.get("/admin/funnel", headers=admin)
    assert response.status_code == 200
    snapshot = response.json()
    assert snapshot["window_days"] == 30
    assert snapshot["timezone"] == "UTC"
    steps = {step["key"]: step for step in snapshot["steps"]}
    assert steps["registration"]["entities"] >= 3
    assert steps["company"]["entities"] == 2
    assert steps["activation"]["entities"] == 2
    assert steps["offer"]["entities"] == 1
    assert steps["order"]["entities"] == 1
    assert steps["delivery"]["entities"] == 0

    buyer = client.get("/admin/funnel?role=buyer&category=plastic", headers=admin).json()
    buyer_steps = {step["key"]: step["entities"] for step in buyer["steps"]}
    assert buyer_steps["activation"] == 1
    assert buyer_steps["order"] == 1

    events = list(db.scalars(select(ProductEvent).order_by(ProductEvent.created_at)))
    order_event = next(
        event
        for event in events
        if event.name == ProductEventName.ORDER_CREATED and event.role == "buyer"
    )
    assert order_event.entity_id == uuid.UUID(order.json()["id"])
    assert order_event.schema_version == 1
    assert order_event.actor_user_id
    assert order_event.company_id
    assert order_event.role == "buyer"
    assert order_event.city
    assert order_event.category == "plastic"
    assert not analytics.FORBIDDEN_PROPERTY_KEYS.intersection(order_event.properties)


def test_product_event_rejects_pii_fields(client: TestClient, db: Session) -> None:
    register(client, "privacy@example.com")
    actor = db.scalar(select(User).where(User.email == "privacy@example.com"))
    with pytest.raises(ValueError, match="PII"):
        analytics.track(
            db,
            ProductEventName.USER_REGISTERED,
            actor=actor,
            entity=actor,
            role="unassigned",
            properties={"email": "not-allowed@example.com"},
        )
