from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.db.models import OutboxEvent
from tests.conftest import FakeClerk, register
from tests.test_deals import deal, offer  # noqa: F401  (fixture)

Headers = dict[str, str]


def _team(client: TestClient, headers: Headers, company_id: str) -> dict:
    return client.get(f"/companies/{company_id}/team", headers=headers).json()


def test_invite_before_signup_then_join(
    client: TestClient,
    db: Session,
    deal: dict[str, Any],  # noqa: F811
) -> None:
    cid = deal["buyer_company"]
    invited = client.post(
        f"/companies/{cid}/team", json={"email": "Luis@Example.com"}, headers=deal["buyer"]
    )
    assert invited.status_code == 201, invited.text
    assert [i["email"] for i in invited.json()["invitations"]] == ["luis@example.com"]
    event = db.scalar(select(OutboxEvent).where(OutboxEvent.kind == "direct.email"))
    assert event.payload["to"] == "luis@example.com"
    again = client.post(
        f"/companies/{cid}/team", json={"email": "luis@example.com"}, headers=deal["buyer"]
    )
    assert again.status_code == 409

    # Luis signs up with that email and lands in the company as a member.
    luis = register(client, "luis@example.com")
    me = client.get("/me", headers=luis).json()
    assert [(c["company_id"], c["role"]) for c in me["companies"]] == [(cid, "member")]
    team = _team(client, deal["buyer"], cid)
    assert [m["role"] for m in team["members"]] == ["owner", "member"]
    assert team["invitations"] == []


def test_unverified_email_does_not_join(
    client: TestClient,
    clerk: FakeClerk,
    deal: dict[str, Any],  # noqa: F811
) -> None:
    cid = deal["buyer_company"]
    client.post(f"/companies/{cid}/team", json={"email": "luis@example.com"}, headers=deal["buyer"])
    clerk.email_verified = False
    luis = register(client, "luis@example.com")
    assert client.get("/me", headers=luis).json()["companies"] == []


def test_members_work_but_only_managers_commit(
    client: TestClient,
    db: Session,
    deal: dict[str, Any],  # noqa: F811
) -> None:
    cid = deal["buyer_company"]
    luis = register(client, "luis@example.com")
    added = client.post(
        f"/companies/{cid}/team", json={"email": "luis@example.com"}, headers=deal["buyer"]
    )
    assert [m["email"] for m in added.json()["members"]] == [
        "buyer@example.com",
        "luis@example.com",
    ]
    event = db.scalar(
        select(OutboxEvent)
        .where(OutboxEvent.kind == "direct.email")
        .order_by(OutboxEvent.created_at.desc())
    )
    assert event.payload["subject"].startswith("RexFy · Ahora eres parte")

    # A member chats and counters, but cannot accept the seller's quote or manage the team.
    quote = offer(client, deal["seller"], deal["thread_id"])
    msg = client.post(
        f"/threads/{deal['thread_id']}/messages", json={"body": "Lo reviso"}, headers=luis
    )
    assert msg.status_code == 201
    assert client.post(f"/offers/{quote['id']}/accept", headers=luis).status_code == 403
    invite = client.post(f"/companies/{cid}/team", json={"email": "x@example.com"}, headers=luis)
    assert invite.status_code == 403

    # Promoted to admin, Luis can.
    luis_id = next(m["user_id"] for m in added.json()["members"] if m["role"] == "member")
    promoted = client.patch(
        f"/companies/{cid}/team/{luis_id}", json={"role": "admin"}, headers=deal["buyer"]
    )
    assert promoted.status_code == 200
    assert client.post(f"/offers/{quote['id']}/accept", headers=luis).status_code == 200


def test_owner_stays(client: TestClient, deal: dict[str, Any]) -> None:  # noqa: F811
    cid = deal["buyer_company"]
    owner_id = _team(client, deal["buyer"], cid)["members"][0]["user_id"]
    assert (
        client.delete(f"/companies/{cid}/team/{owner_id}", headers=deal["buyer"]).status_code == 409
    )
    assert (
        client.patch(
            f"/companies/{cid}/team/{owner_id}", json={"role": "member"}, headers=deal["buyer"]
        ).status_code
        == 409
    )
    luis = register(client, "luis@example.com")
    client.post(f"/companies/{cid}/team", json={"email": "luis@example.com"}, headers=deal["buyer"])
    luis_id = client.get("/me", headers=luis).json()["id"]
    # Anyone but the owner can leave on their own.
    assert client.delete(f"/companies/{cid}/team/{luis_id}", headers=luis).status_code == 204
    assert client.get(f"/companies/{cid}/team", headers=luis).status_code == 404
