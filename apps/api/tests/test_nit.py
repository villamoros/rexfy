import pytest

from app.domain.organizations.nit import normalize_nit


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("890.903.938-8", "890903938-8"),
        ("8909039388", "890903938-8"),
        (" 900 123 456-8 ", "900123456-8"),
    ],
)
def test_normalizes_valid_nit(raw: str, expected: str) -> None:
    assert normalize_nit(raw) == expected


@pytest.mark.parametrize("raw", ["890903938-1", "123", "abc-1", "900123456-"])
def test_rejects_invalid_nit(raw: str) -> None:
    with pytest.raises(ValueError):
        normalize_nit(raw)
