"""stable pagination indexes

Revision ID: b7e4a2c91f30
Revises: a1f6c3d9e205
Create Date: 2026-11-23 16:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "b7e4a2c91f30"
down_revision: str | Sequence[str] | None = "a1f6c3d9e205"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


INDEXES = (
    ("ix_chat_threads_activity_cursor", "chat_threads", ["last_activity_at", "id"]),
    ("ix_chat_messages_thread_cursor", "chat_messages", ["thread_id", "created_at", "id"]),
    ("ix_transactions_created_cursor", "transactions", ["created_at", "id"]),
    ("ix_shipments_created_cursor", "shipments", ["created_at", "id"]),
    ("ix_companies_created_cursor", "companies", ["created_at", "id"]),
    ("ix_listings_created_cursor", "listings", ["created_at", "id"]),
    ("ix_audit_logs_created_cursor", "audit_logs", ["created_at", "id"]),
    ("ix_outbox_events_created_cursor", "outbox_events", ["created_at", "id"]),
)


def upgrade() -> None:
    for name, table, columns in INDEXES:
        op.create_index(name, table, columns)


def downgrade() -> None:
    for name, table, _ in reversed(INDEXES):
        op.drop_index(name, table_name=table)
