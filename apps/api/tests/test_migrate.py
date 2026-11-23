from alembic.config import Config

from app.cli.migrate import state
from app.infrastructure.db.session import engine


def test_database_is_at_the_single_expected_head() -> None:
    with engine.connect() as connection:
        migration_state = state(connection, Config("alembic.ini"))

    assert len(migration_state.expected) == 1
    assert migration_state.at_head
