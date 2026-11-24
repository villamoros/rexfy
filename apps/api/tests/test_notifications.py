from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.application import notifications, outbox
from app.domain.notifications.enums import OutboxStatus
from app.infrastructure.db.models import Notification, OutboxDelivery, OutboxEvent
from tests.test_deals import deal, offer  # noqa: F401  (fixture)


def _events(db: Session) -> list[OutboxEvent]:
    return list(db.scalars(select(OutboxEvent).order_by(OutboxEvent.created_at)))


def test_messages_notify_the_other_side_once(
    client: TestClient,
    db: Session,
    deal: dict[str, Any],  # noqa: F811
) -> None:
    seller_inbox = client.get("/notifications", headers=deal["seller"]).json()
    assert [item["kind"] for item in seller_inbox] == ["message"]
    initial_events = len(_events(db))

    tid = deal["thread_id"]
    for body in ("¿Sigue disponible?", "¿Y el precio por tonelada?"):
        client.post(f"/threads/{tid}/messages", json={"body": body}, headers=deal["buyer"])
    seller_inbox = client.get("/notifications", headers=deal["seller"]).json()
    assert len(seller_inbox) == 1
    assert seller_inbox[0]["body"].endswith("¿Y el precio por tonelada?")
    assert len(_events(db)) == initial_events

    client.post("/notifications/read", headers=deal["seller"])
    client.post(f"/threads/{tid}/messages", json={"body": "Hola de nuevo"}, headers=deal["buyer"])
    assert client.get("/notifications/unread-count", headers=deal["seller"]).json() == {"unread": 1}
    event = _events(db)[-1]
    assert event.payload["company_id"] == deal["seller_company"]
    assert event.payload["link"] == f"/mensajes/{tid}"
    assert len(event.payload["_trace_id"]) == 32


def test_offers_and_orders_create_durable_events(
    client: TestClient,
    db: Session,
    deal: dict[str, Any],  # noqa: F811
) -> None:
    before = len(_events(db))
    quote = offer(client, deal["seller"], deal["thread_id"])
    client.post(f"/offers/{quote['id']}/accept", headers=deal["buyer"])
    created = _events(db)[before:]
    assert [event.payload["company_id"] for event in created] == [
        deal["buyer_company"],
        deal["seller_company"],
    ]
    assert all(event.status is OutboxStatus.PENDING for event in created)


def test_outbox_rolls_back_with_business_notification(
    db: Session,
    deal: dict[str, Any],  # noqa: F811
) -> None:
    notification_count = db.scalar(select(func.count(Notification.id)))
    event_count = db.scalar(select(func.count(OutboxEvent.id)))
    nested = db.begin_nested()
    notifications.notify(
        db,
        deal["seller_company"],
        kind="rollback_test",
        title="No debe persistir",
        link="/rollback-test",
    )
    db.flush()
    nested.rollback()
    assert db.scalar(select(func.count(Notification.id))) == notification_count
    assert db.scalar(select(func.count(OutboxEvent.id))) == event_count


def test_dispatch_retries_then_delivers_once(
    db: Session,
    deal: dict[str, Any],  # noqa: F811
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    event = _events(db)[0]
    calls: list[str] = []

    def flaky(to: str, *_: str, **__: str) -> None:
        calls.append(to)
        if len(calls) == 1:
            raise OSError("SMTP temporalmente fuera de servicio")

    monkeypatch.setattr(outbox, "send_email", flaky)
    assert outbox.process_event(db, event.id) is OutboxStatus.RETRY
    assert outbox.process_event(db, event.id) is OutboxStatus.PROCESSED
    assert calls == ["seller@example.com", "seller@example.com"]
    assert outbox.process_event(db, event.id) is OutboxStatus.PROCESSED
    assert len(calls) == 2
    delivery = db.scalar(select(OutboxDelivery).where(OutboxDelivery.event_id == event.id))
    assert delivery.delivered_at is not None
    assert delivery.attempts == 2
