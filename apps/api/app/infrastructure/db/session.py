import os
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import get_settings

# On Vercel each function instance would keep its own pool; the database's pooler does that job.
engine = (
    create_engine(get_settings().database_url, poolclass=NullPool)
    if os.environ.get("VERCEL")
    else create_engine(get_settings().database_url, pool_pre_ping=True)
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    with SessionLocal() as session:
        yield session
