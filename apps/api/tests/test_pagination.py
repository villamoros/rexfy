import uuid
from datetime import UTC, datetime

import pytest

from app.application.pagination import InvalidCursor, decode_cursor, encode_cursor


def test_cursor_round_trip_is_opaque_and_stable():
    created_at = datetime(2026, 11, 23, 12, 30, tzinfo=UTC)
    entity_id = uuid.uuid4()

    encoded = encode_cursor(created_at, entity_id)

    assert decode_cursor(encoded).created_at == created_at
    assert decode_cursor(encoded).entity_id == entity_id
    assert "2026-11-23" not in encoded


@pytest.mark.parametrize("value", ["not-base64", "e30", "W10"])
def test_cursor_rejects_invalid_payloads(value):
    with pytest.raises(InvalidCursor):
        decode_cursor(value)
