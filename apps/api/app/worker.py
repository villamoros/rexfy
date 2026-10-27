"""Processes background jobs (emails for now).

Run from apps/api:  uv run python -m app.worker
"""

import logging

from rq import Worker

from app.infrastructure.tasks import get_queue


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    queue = get_queue()
    Worker([queue], connection=queue.connection).work()


if __name__ == "__main__":
    main()
