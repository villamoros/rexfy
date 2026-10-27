from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.application import notifications
from tests.test_deals import deal, offer  # noqa: F401  (fixture)


@pytest.fixture
def outbox(monkeypatch: pytest.MonkeyPatch) -> list[tuple]:
    """Emails the app would hand to the worker."""
    sent: list[tuple] = []
    monkeypatch.setattr(notifications, "enqueue", lambda job, *args: sent.append(args))
    return sent


def test_messages_notify_the_other_side_once(
    client: TestClient,
    deal: dict[str, Any],  # noqa: F811
    outbox: list[tuple],
) -> None:
    # The fixture's first message already reached the seller.
    seller_inbox = client.get("/notifications", headers=deal["seller"]).json()
    assert [n["kind"] for n in seller_inbox] == ["message"]
    assert seller_inbox[0]["link"] == f"/mensajes/{deal['thread_id']}"

    tid = deal["thread_id"]
    for body in ("¿Sigue disponible?", "¿Y el precio por tonelada?"):
        client.post(f"/threads/{tid}/messages", json={"body": body}, headers=deal["buyer"])
    # Still one unread notification about this chat, showing the latest message, no new email.
    seller_inbox = client.get("/notifications", headers=deal["seller"]).json()
    assert len(seller_inbox) == 1
    assert seller_inbox[0]["body"].endswith("¿Y el precio por tonelada?")
    assert outbox == []  # the fixture's email went out before the outbox was watched

    client.post("/notifications/read", headers=deal["seller"])
    assert client.get("/notifications/unread-count", headers=deal["seller"]).json() == {"unread": 0}

    # A read notification no longer swallows the next message.
    client.post(f"/threads/{tid}/messages", json={"body": "Hola de nuevo"}, headers=deal["buyer"])
    assert client.get("/notifications/unread-count", headers=deal["seller"]).json() == {"unread": 1}
    assert len(outbox) == 1
    company_id, title, _, link = outbox[0]
    assert company_id == deal["seller_company"]
    assert title.startswith("Mensaje de Empresa")
    assert link == f"/mensajes/{tid}"


def test_offers_and_orders_notify(
    client: TestClient,
    deal: dict[str, Any],  # noqa: F811
    outbox: list[tuple],
) -> None:
    quote = offer(client, deal["seller"], deal["thread_id"])
    buyer_kinds = [n["kind"] for n in client.get("/notifications", headers=deal["buyer"]).json()]
    assert buyer_kinds == ["offer"]
    client.post(f"/offers/{quote['id']}/accept", headers=deal["buyer"])
    seller = client.get("/notifications", headers=deal["seller"]).json()
    assert seller[0]["kind"] == "offer_accepted"
    assert seller[0]["link"].startswith("/ordenes/")
    assert [args[0] for args in outbox] == [deal["buyer_company"], deal["seller_company"]]

    stranger_view = client.get("/notifications", headers=deal["buyer"]).json()
    assert all(n["company_id"] == deal["buyer_company"] for n in stranger_view)


def test_email_job_writes_to_every_member(
    client: TestClient,
    db,
    deal: dict[str, Any],  # noqa: F811
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.infrastructure.db import session as db_session

    sent: list[tuple[str, str, str]] = []
    monkeypatch.setattr(notifications, "send_email", lambda *args: sent.append(args))
    # The job opens its own session; point it at the test transaction.
    monkeypatch.setattr(db_session, "SessionLocal", lambda: _Borrowed(db))
    notifications.email_company(deal["seller_company"], "Hola", "Cuerpo", "/panel")
    assert sent == [
        (
            "seller@example.com",
            "RexFy · Hola",
            "Cuerpo\n\nVer en RexFy: http://localhost:3000/panel\n",
        )
    ]


class _Borrowed:
    def __init__(self, db) -> None:
        self.db = db

    def __enter__(self):
        return self.db

    def __exit__(self, *_) -> None:
        pass
