"""Checked, serialized Alembic migrations for release automation."""

import argparse
import json
from dataclasses import asdict, dataclass

from alembic import command
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection
from sqlalchemy.pool import NullPool

from app.core.config import get_settings

LOCK_ID = 7_329_446_965_619_021_113


@dataclass(frozen=True)
class MigrationState:
    current: tuple[str, ...]
    expected: tuple[str, ...]

    @property
    def at_head(self) -> bool:
        return self.current == self.expected


def state(connection: Connection, config: Config) -> MigrationState:
    current = tuple(sorted(MigrationContext.configure(connection).get_current_heads()))
    expected = tuple(sorted(ScriptDirectory.from_config(config).get_heads()))
    if len(expected) != 1:
        raise RuntimeError(f"Se esperaba una sola cabeza de migración; se encontraron {expected}")
    return MigrationState(current=current, expected=expected)


def run(*, mode: str) -> MigrationState:
    settings = get_settings()
    url = settings.database_url_unpooled or settings.database_url
    engine = create_engine(
        url, poolclass=NullPool, pool_pre_ping=True, connect_args={"connect_timeout": 10}
    )
    config = Config("alembic.ini")
    try:
        with engine.connect() as connection:
            locked = connection.execute(
                text("SELECT pg_try_advisory_lock(:lock_id)"), {"lock_id": LOCK_ID}
            ).scalar_one()
            if not locked:
                raise RuntimeError("Otra migración de RexFy está en ejecución")
            # Advisory locks are session-scoped. End the SELECT's implicit transaction so
            # Alembic owns and commits its migration transaction on this same connection.
            connection.commit()
            try:
                before = state(connection, config)
                if mode == "upgrade" and not before.at_head:
                    config.attributes["connection"] = connection
                    command.upgrade(config, "head")
                after = state(connection, config)
                if mode != "status" and not after.at_head:
                    raise RuntimeError(
                        f"Verificación fallida: base={after.current}, código={after.expected}"
                    )
                return after
            finally:
                connection.execute(
                    text("SELECT pg_advisory_unlock(:lock_id)"), {"lock_id": LOCK_ID}
                )
                connection.commit()
    finally:
        engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "mode",
        choices=("status", "check", "upgrade"),
        help="status inspecciona; check exige head; upgrade aplica y verifica bajo un lock",
    )
    args = parser.parse_args()
    result = run(mode=args.mode)
    print(json.dumps({**asdict(result), "at_head": result.at_head}))


if __name__ == "__main__":
    main()
