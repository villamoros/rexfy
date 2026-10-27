from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.cli.seed import DEMO, seed


def test_seed_fills_marketplace_and_is_idempotent(client: TestClient, db: Session) -> None:
    assert seed(db) == len(DEMO)
    assert seed(db) == 0
    listings = client.get("/listings").json()
    items = listings["items"] if isinstance(listings, dict) else listings
    assert len(items) == sum(len(d[4]) for d in DEMO)
