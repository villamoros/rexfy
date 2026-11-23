from unittest.mock import Mock

import pytest

from app.application.unit_of_work import unit_of_work


def test_unit_of_work_commits_once_after_success():
    session = Mock()

    with next_unit_of_work(session):
        session.flush()

    session.commit.assert_called_once_with()
    session.rollback.assert_not_called()


def test_unit_of_work_rolls_back_and_does_not_commit_after_failure():
    session = Mock()

    with pytest.raises(RuntimeError), next_unit_of_work(session):
        raise RuntimeError("falló el comando")

    session.rollback.assert_called_once_with()
    session.commit.assert_not_called()


class next_unit_of_work:
    """Small context adapter around the dependency generator."""

    def __init__(self, session):
        self.generator = unit_of_work(session)

    def __enter__(self):
        return next(self.generator)

    def __exit__(self, exc_type, exc, traceback):
        try:
            if exc is not None:
                self.generator.throw(exc)
            else:
                next(self.generator)
        except StopIteration:
            return False
