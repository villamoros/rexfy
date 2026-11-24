"""Polls and dispatches the durable transactional outbox.

Run from apps/api:  uv run python -m app.worker
"""

from app.application.outbox import run_forever
from app.core.config import get_settings
from app.core.observability import configure_logging
from app.infrastructure.email import require_email_transport


def main() -> None:
    configure_logging(get_settings())
    require_email_transport()
    run_forever()


if __name__ == "__main__":
    main()
