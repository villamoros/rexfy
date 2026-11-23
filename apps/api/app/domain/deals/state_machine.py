from app.domain.deals.enums import OfferStatus, TransactionStatus


class InvalidTransition(ValueError):
    pass


OFFER_TRANSITIONS: dict[OfferStatus, frozenset[OfferStatus]] = {
    OfferStatus.PENDING: frozenset(
        {OfferStatus.ACCEPTED, OfferStatus.DECLINED, OfferStatus.COUNTERED}
    ),
    OfferStatus.ACCEPTED: frozenset(),
    OfferStatus.DECLINED: frozenset(),
    OfferStatus.COUNTERED: frozenset(),
}

TRANSACTION_TRANSITIONS: dict[TransactionStatus, frozenset[TransactionStatus]] = {
    TransactionStatus.AGREED: frozenset(
        {TransactionStatus.IN_TRANSIT, TransactionStatus.COMPLETED}
    ),
    TransactionStatus.IN_TRANSIT: frozenset({TransactionStatus.DELIVERED}),
    TransactionStatus.DELIVERED: frozenset({TransactionStatus.COMPLETED}),
    TransactionStatus.COMPLETED: frozenset(),
}


def require_offer_transition(current: OfferStatus, target: OfferStatus) -> None:
    if target not in OFFER_TRANSITIONS[current]:
        raise InvalidTransition(f"No se puede cambiar una oferta de {current} a {target}")


def require_transaction_transition(current: TransactionStatus, target: TransactionStatus) -> None:
    if target not in TRANSACTION_TRANSITIONS[current]:
        raise InvalidTransition(f"No se puede cambiar una orden de {current} a {target}")
