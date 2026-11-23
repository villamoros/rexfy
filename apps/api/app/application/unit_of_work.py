"""One explicit transaction boundary for application commands."""

from collections.abc import Iterator

from sqlalchemy.orm import Session


class SqlAlchemyUnitOfWork:
    def __init__(self, session: Session):
        self.session = session

    def commit(self) -> None:
        self.session.commit()

    def rollback(self) -> None:
        self.session.rollback()


def unit_of_work(session: Session) -> Iterator[SqlAlchemyUnitOfWork]:
    uow = SqlAlchemyUnitOfWork(session)
    try:
        yield uow
    except Exception:
        uow.rollback()
        raise
    else:
        uow.commit()
