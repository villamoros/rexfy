"""baseline

Revision ID: ed514c08f7a1
Revises:
Create Date: 2026-10-27 01:53:03.497520

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "ed514c08f7a1"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
