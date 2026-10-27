"""clerk identity

Revision ID: 3c5d2f8a9b10
Revises: 089fe76545b2
Create Date: 2026-10-27 03:10:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3c5d2f8a9b10"
down_revision: str | Sequence[str] | None = "089fe76545b2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("users", sa.Column("clerk_user_id", sa.String(length=64), nullable=True))
    op.create_index(op.f("ix_users_clerk_user_id"), "users", ["clerk_user_id"], unique=True)
    # Passwords now live in Clerk; existing users are linked by email on their first sign-in.
    op.drop_column("users", "password_hash")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        "users",
        sa.Column("password_hash", sa.String(length=255), nullable=False, server_default=""),
    )
    op.alter_column("users", "password_hash", server_default=None)
    op.drop_index(op.f("ix_users_clerk_user_id"), table_name="users")
    op.drop_column("users", "clerk_user_id")
