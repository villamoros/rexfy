"""Colombian NIT (Número de Identificación Tributaria) normalization and check digit."""

import re

# DIAN weights, applied right to left over the NIT digits.
_WEIGHTS = (3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71)


def check_digit(base: str) -> int:
    total = sum(int(d) * w for d, w in zip(reversed(base), _WEIGHTS, strict=False))
    remainder = total % 11
    return remainder if remainder < 2 else 11 - remainder


def normalize_nit(raw: str) -> str:
    """Return the NIT as "<base>-<dv>" or raise ValueError if it is malformed or the dv is wrong.

    Accepts dots, spaces and an optional dash, e.g. "900.123.456-8" or "9001234568".
    """
    cleaned = re.sub(r"[.\s]", "", raw)
    match = re.fullmatch(r"(\d{6,15})-?(\d)", cleaned)
    if not match:
        raise ValueError("El NIT debe tener entre 6 y 15 dígitos más el dígito de verificación")
    base, dv = match.groups()
    if check_digit(base) != int(dv):
        raise ValueError("El dígito de verificación del NIT no es válido")
    return f"{base}-{dv}"
