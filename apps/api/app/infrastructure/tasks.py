"""Background jobs on Redis (RQ). Run the worker with:  uv run python -m app.worker"""

import logging
from collections.abc import Callable
from functools import lru_cache
from typing import Any

from redis import Redis
from rq import Queue, Retry

from app.core.config import get_settings

log = logging.getLogger("rexfy.tasks")


@lru_cache
def get_queue() -> Queue:
    return Queue("rexfy", connection=Redis.from_url(get_settings().redis_url))


def enqueue(job: Callable[..., Any], *args: Any) -> None:
    """Run `job` in the worker. A Redis outage never fails the request that asked for it."""
    mode = get_settings().task_queue
    if mode == "off":
        return
    if mode == "inline":
        job(*args)
        return
    try:
        get_queue().enqueue(job, *args, retry=Retry(max=3, interval=[10, 60, 300]))
    except Exception:
        log.exception("No se pudo encolar %s", job.__name__)
