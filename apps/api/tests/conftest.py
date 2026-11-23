import os
import tempfile
import uuid
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
os.environ["REXFY_TASK_QUEUE"] = "off"
os.environ["REXFY_RATE_LIMIT_WRITES_PER_MINUTE"] = "0"
# Uploads go to a throwaway folder.
os.environ["REXFY_LOCAL_STORAGE_DIR"] = tempfile.mkdtemp(prefix="rexfy-uploads-")
get_settings.cache_clear()

_admin = create_engine(_dev_url.set(database="postgres"), isolation_level="AUTOCOMMIT")
with _admin.connect() as conn:
    # Recreated on every run so a schema left by another branch never gets in the way.
    conn.execute(text(f'DROP DATABASE IF EXISTS "{_test_url.database}" WITH (FORCE)'))
    conn.execute(text(f'CREATE DATABASE "{_test_url.database}"'))
_admin.dispose()

from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.infrastructure.auth.clerk import Profile, get_clerk  # noqa: E402
from app.infrastructure.db.base import Base  # noqa: E402
from app.infrastructure.db.session import (  # noqa: E402
    SessionLocal,  # noqa: E402
    engine,
    get_db,
)
from app.main import app  # noqa: E402

command.upgrade(Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini")), "head")


class IdempotentTestClient(TestClient):
    """Give legacy tests a fresh command key; focused tests may provide a stable one."""

    def request(self, method: str, url, **kwargs):
        if method.upper() in {"POST", "PUT", "PATCH", "DELETE"}:
            headers = dict(kwargs.pop("headers", {}) or {})
            headers.setdefault("Idempotency-Key", str(uuid.uuid4()))
            kwargs["headers"] = headers
        return super().request(method, url, **kwargs)


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


class FakeClerk:
    """Stands in for Clerk: the token "test:<email>" belongs to the Clerk user "user_<email>"."""

    def __init__(self) -> None:
        self.profile_calls = 0
        self.email_verified = True

    def verify(self, token: str) -> str | None:
        prefix, _, email = token.partition(":")
        return f"user_{email}" if prefix == "test" and email else None

    def profile(self, clerk_user_id: str) -> Profile:
        self.profile_calls += 1
        return Profile(
            email=clerk_user_id.removeprefix("user_"),
            full_name="Ana Gómez",
            email_verified=self.email_verified,
        )


@pytest.fixture
def clerk() -> FakeClerk:
    return FakeClerk()


@pytest.fixture
def client(db: Session, clerk: FakeClerk) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_clerk] = lambda: clerk
    with IdempotentTestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def committed_client(clerk: FakeClerk) -> Iterator[TestClient]:
    """A client with one real DB session per request, suitable for concurrency tests."""
    table_names = ", ".join(f'"{name}"' for name in Base.metadata.tables)
    with engine.begin() as connection:
        connection.execute(text(f"TRUNCATE TABLE {table_names} RESTART IDENTITY CASCADE"))
    app.dependency_overrides[get_clerk] = lambda: clerk
    try:
        with IdempotentTestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.clear()
        with SessionLocal.begin() as session:
            session.execute(text(f"TRUNCATE TABLE {table_names} RESTART IDENTITY CASCADE"))


def register(client: TestClient, email: str = "ana@example.com") -> dict[str, str]:
    """Sign in as a Clerk user, creating the local user on the first request."""
    headers = {"Authorization": f"Bearer test:{email}"}
    response = client.get("/me", headers=headers)
    assert response.status_code == 200, response.text
    return headers


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
