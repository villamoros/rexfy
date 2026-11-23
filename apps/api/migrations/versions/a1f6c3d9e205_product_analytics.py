"""product analytics ledger

Revision ID: a1f6c3d9e205
Revises: 8c2a7e4f1d90
Create Date: 2026-11-23 12:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a1f6c3d9e205"
down_revision: str | Sequence[str] | None = "8c2a7e4f1d90"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "product_events",
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("schema_version", sa.Integer(), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=True),
        sa.Column("role", sa.String(length=40), nullable=False),
        sa.Column("entity_type", sa.String(length=80), nullable=False),
        sa.Column("entity_id", sa.Uuid(), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("cohort_month", sa.Date(), nullable=True),
        sa.Column("properties", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_product_events_actor_user_id"), "product_events", ["actor_user_id"])
    op.create_index(op.f("ix_product_events_category"), "product_events", ["category"])
    op.create_index(op.f("ix_product_events_city"), "product_events", ["city"])
    op.create_index(op.f("ix_product_events_cohort_month"), "product_events", ["cohort_month"])
    op.create_index(op.f("ix_product_events_company_id"), "product_events", ["company_id"])
    op.create_index(op.f("ix_product_events_entity_id"), "product_events", ["entity_id"])
    op.create_index(op.f("ix_product_events_name"), "product_events", ["name"])
    op.create_index(op.f("ix_product_events_role"), "product_events", ["role"])
    op.create_index("ix_product_events_name_created", "product_events", ["name", "created_at"])
    op.create_index("ix_product_events_role_created", "product_events", ["role", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_product_events_role_created", table_name="product_events")
    op.drop_index("ix_product_events_name_created", table_name="product_events")
    op.drop_index(op.f("ix_product_events_role"), table_name="product_events")
    op.drop_index(op.f("ix_product_events_name"), table_name="product_events")
    op.drop_index(op.f("ix_product_events_entity_id"), table_name="product_events")
    op.drop_index(op.f("ix_product_events_company_id"), table_name="product_events")
    op.drop_index(op.f("ix_product_events_cohort_month"), table_name="product_events")
    op.drop_index(op.f("ix_product_events_city"), table_name="product_events")
    op.drop_index(op.f("ix_product_events_category"), table_name="product_events")
    op.drop_index(op.f("ix_product_events_actor_user_id"), table_name="product_events")
    op.drop_table("product_events")
