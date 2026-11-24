"""Logs, request ids and error reporting."""

import json
import logging
import re
import secrets
import time
import uuid
from contextvars import ContextVar

from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.config import Settings

request_id: ContextVar[str] = ContextVar("request_id", default="-")
trace_id: ContextVar[str] = ContextVar("trace_id", default="-")

_TRACEPARENT = re.compile(
    r"^00-(?P<trace>[0-9a-f]{32})-(?P<span>[0-9a-f]{16})-(?P<flags>[0-9a-f]{2})$"
)

log = logging.getLogger("rexfy.http")


class JsonFormatter(logging.Formatter):
    """One JSON object per line, ready for any log collector."""

    def format(self, record: logging.LogRecord) -> str:
        entry = {
            "time": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id.get(),
            "trace_id": trace_id.get(),
        }
        entry.update(getattr(record, "fields", {}))
        if record.exc_info:
            entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(entry, ensure_ascii=False, default=str)


def configure_logging(settings: Settings) -> None:
    handler = logging.StreamHandler()
    if settings.env in ("local", "test"):
        handler.setFormatter(logging.Formatter("%(levelname)s %(name)s: %(message)s"))
    else:
        handler.setFormatter(JsonFormatter())
    root = logging.getLogger("rexfy")
    root.handlers = [handler]
    root.setLevel(logging.INFO)
    root.propagate = False


class RequestLogMiddleware(BaseHTTPMiddleware):
    """Tags each request with an id (from X-Request-ID or new) and logs how it went."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex[:16]
        incoming_trace = _TRACEPARENT.fullmatch(request.headers.get("traceparent", ""))
        current_trace = incoming_trace.group("trace") if incoming_trace else secrets.token_hex(16)
        server_span = secrets.token_hex(8)
        request_token = request_id.set(rid)
        trace_token = trace_id.set(current_trace)
        started = time.perf_counter()
        try:
            response = await call_next(request)
            elapsed = round((time.perf_counter() - started) * 1000, 1)
            response.headers["X-Request-ID"] = rid
            response.headers["Traceparent"] = f"00-{current_trace}-{server_span}-01"
            log.info(
                "%s %s %s %sms",
                request.method,
                request.url.path,
                response.status_code,
                elapsed,
                extra={
                    "fields": {
                        "request_id": rid,
                        "trace_id": current_trace,
                        "span_id": server_span,
                        "method": request.method,
                        "path": request.url.path,
                        "status": response.status_code,
                        "duration_ms": elapsed,
                    }
                },
            )
            return response
        except Exception:
            log.exception(
                "%s %s failed",
                request.method,
                request.url.path,
                extra={
                    "fields": {
                        "request_id": rid,
                        "trace_id": current_trace,
                        "span_id": server_span,
                        "method": request.method,
                        "path": request.url.path,
                        "status": 500,
                        "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                    }
                },
            )
            raise
        finally:
            request_id.reset(request_token)
            trace_id.reset(trace_token)


def setup(app: FastAPI, settings: Settings) -> None:
    configure_logging(settings)
    app.add_middleware(RequestLogMiddleware)
    if settings.sentry_dsn:
        import sentry_sdk

        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.env,
            traces_sample_rate=0.1,
            send_default_pii=False,
        )
