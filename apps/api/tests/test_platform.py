from collections import Counter as Tally

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.rate_limit import RateLimitMiddleware


class MemoryCounter:
    def __init__(self) -> None:
        self.counts: Tally[str] = Tally()

    def hit(self, key: str, window_seconds: int) -> int:
        self.counts[key] += 1
        return self.counts[key]


class BrokenCounter:
    def hit(self, key: str, window_seconds: int) -> int:
        raise ConnectionError("redis down")


def _app(counter) -> TestClient:
    app = FastAPI()
    app.add_middleware(RateLimitMiddleware, counter=counter, writes_per_minute=2)

    @app.post("/x")
    def write() -> dict:
        return {}

    @app.get("/x")
    def read() -> dict:
        return {}

    return TestClient(app)


def test_rate_limit_caps_writes_per_caller() -> None:
    client = _app(MemoryCounter())
    ana = {"Authorization": "Bearer ana"}
    assert [client.post("/x", headers=ana).status_code for _ in range(3)] == [200, 200, 429]
    assert client.post("/x", headers={"Authorization": "Bearer otro"}).status_code == 200
    assert client.get("/x", headers=ana).status_code == 200  # reads are not limited


def test_rate_limit_lets_requests_through_without_redis() -> None:
    client = _app(BrokenCounter())
    assert [client.post("/x").status_code for _ in range(3)] == [200, 200, 200]


def test_responses_carry_a_request_id(client: TestClient) -> None:
    assert len(client.get("/health").headers["x-request-id"]) == 16
    echoed = client.get("/health", headers={"X-Request-ID": "abc123"})
    assert echoed.headers["x-request-id"] == "abc123"
