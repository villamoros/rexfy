import os
from collections.abc import Iterator

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.core.config import get_settings

# Tests run against their own database ("<name>_test"), so local data never affects them
# and they never touch it. This must happen before the app creates its engine.
_dev_url = make_url(get_settings().database_url)
_test_url = _dev_url.set(database=f"{_dev_url.database}_test")
os.environ["REXFY_DATABASE_URL"] = _test_url.render_as_string(hide_password=False)
get_settings.cache_clear()

_admin = create_engine(_dev_url.set(database="postgres"), isolation_level="AUTOCOMMIT")
with _admin.connect() as conn:
    exists = conn.scalar(
        text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": _test_url.database}
    )
    if not exists:
        conn.execute(text(f'CREATE DATABASE "{_test_url.database}"'))
_admin.dispose()

from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.infrastructure.db.session import engine, get_db  # noqa: E402
from app.main import app  # noqa: E402

command.upgrade(Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini")), "head")


@pytest.fixture
def db() -> Iterator[Session]:
    """A session whose commits are rolled back after each test."""
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


def nit(base: str) -> str:
    """Build a NIT with a valid DIAN check digit from its base digits."""
    from app.domain.organizations.nit import check_digit

    return f"{base}-{check_digit(base)}"


def company(client: TestClient, headers: dict[str, str], roles: list[str], base: str) -> str:
    response = client.post(
        "/companies",
        json={
            "legal_name": f"Empresa {base}",
            "nit": nit(base),
            "city": "Bogotá",
            "market_roles": roles,
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]
