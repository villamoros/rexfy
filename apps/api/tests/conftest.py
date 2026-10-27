from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.infrastructure.db.session import engine, get_db
from app.main import app


@pytest.fixture
def db() -> Iterator[Session]:
    """A session whose commits are rolled back after each test (schema comes from Alembic)."""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db: Session) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def register(client: TestClient, email: str = "ana@example.com") -> dict[str, str]:
    response = client.post(
        "/auth/register",
        json={"email": email, "password": "supersecreta", "full_name": "Ana Gómez"},
    )
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
