"""Caps how many changes one user (or IP) can make per minute, shared across API instances."""

import hashlib
import logging
import time
from typing import Protocol

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from redis import Redis
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

log = logging.getLogger("rexfy.rate_limit")

WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


class Counter(Protocol):
    def hit(self, key: str, window_seconds: int) -> int: ...


class RedisCounter:
    def __init__(self, url: str) -> None:
        self._redis = Redis.from_url(url, socket_timeout=0.5, socket_connect_timeout=0.5)

    def hit(self, key: str, window_seconds: int) -> int:
        pipe = self._redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds, nx=True)
        count, _ = pipe.execute()
        return int(count)


def client_key(request: Request) -> str:
    """The caller: their session token's hash when signed in, else their IP."""
    auth = request.headers.get("authorization")
    if auth:
        return "u:" + hashlib.sha256(auth.encode()).hexdigest()[:24]
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() or (request.client.host if request.client else "?")
    return "ip:" + ip


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, *, counter: Counter, writes_per_minute: int) -> None:
        super().__init__(app)
        self.counter = counter
        self.limit = writes_per_minute

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if self.limit <= 0 or request.method not in WRITE_METHODS:
            return await call_next(request)
        window = int(time.time() // 60)
        try:
            count = self.counter.hit(f"rl:{client_key(request)}:{window}", 60)
        except Exception:
            # Without Redis there is no shared count; let the request through.
            log.warning("Rate limit sin Redis, se omite", exc_info=True)
            return await call_next(request)
        if count > self.limit:
            return JSONResponse(
                {"detail": "Demasiadas acciones seguidas, espera un minuto e intenta de nuevo"},
                status_code=429,
                headers={"Retry-After": str(60 - int(time.time()) % 60)},
            )
        return await call_next(request)
