from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.application import outbox
from app.core.config import get_settings
from app.infrastructure import email


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness(client: TestClient) -> None:
    response = client.get("/health/ready")
    assert response.status_code == 200
    assert set(response.json()) == {"database", "outbox", "redis", "status"}


def test_old_outbox_degrades_readiness_without_failing_database(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    age = timedelta(seconds=get_settings().outbox_alert_age_seconds + 60)
    monkeypatch.setattr(
        outbox, "health", lambda db: SimpleNamespace(oldest_unprocessed_at=datetime.now(UTC) - age)
    )
    response = client.get("/health/ready")
    assert response.status_code == 200
    checks = response.json()
    assert (checks["database"], checks["outbox"], checks["status"]) == ("ok", "error", "degraded")


def test_live_email_requires_smtp(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = SimpleNamespace(env="production", smtp_host="")
    monkeypatch.setattr(email, "get_settings", lambda: settings)
    with pytest.raises(RuntimeError, match="REXFY_SMTP_HOST"):
        email.send_email("test@example.com", "Prueba", "Mensaje")
