"""search trigram index

Revision ID: d3da1b2af9d6
Revises: 331d9cd639dc
Create Date: 2026-10-27 05:48:59.921106

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d3da1b2af9d6"
down_revision: str | Sequence[str] | None = "331d9cd639dc"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Trigram indexes so ILIKE '%...%' searches on listings don't scan the whole table."""
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("CREATE INDEX ix_listings_title_trgm ON listings USING gin (title gin_trgm_ops)")
    op.execute(
        "CREATE INDEX ix_listings_description_trgm ON listings USING gin (description gin_trgm_ops)"
    )
    op.execute("CREATE INDEX ix_listings_city_trgm ON listings USING gin (city gin_trgm_ops)")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS ix_listings_city_trgm")
    op.execute("DROP INDEX IF EXISTS ix_listings_description_trgm")
    op.execute("DROP INDEX IF EXISTS ix_listings_title_trgm")
