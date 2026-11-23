import itertools

import pytest

from app.domain.deals.enums import OfferStatus, TransactionStatus
from app.domain.deals.state_machine import (
    OFFER_TRANSITIONS,
    TRANSACTION_TRANSITIONS,
    require_offer_transition,
    require_transaction_transition,
)
from app.domain.deals.state_machine import (
    InvalidTransition as InvalidDealTransition,
)
from app.domain.logistics.enums import ShipmentStatus
from app.domain.logistics.state_machine import (
    SHIPMENT_TRANSITIONS,
    require_shipment_transition,
)
from app.domain.logistics.state_machine import (
    InvalidTransition as InvalidShipmentTransition,
)


@pytest.mark.parametrize("current,target", list(itertools.product(OfferStatus, repeat=2)))
def test_every_offer_transition_is_explicit(current, target):
    if target in OFFER_TRANSITIONS[current]:
        require_offer_transition(current, target)
    else:
        with pytest.raises(InvalidDealTransition):
            require_offer_transition(current, target)


@pytest.mark.parametrize("current,target", list(itertools.product(TransactionStatus, repeat=2)))
def test_every_transaction_transition_is_explicit(current, target):
    if target in TRANSACTION_TRANSITIONS[current]:
        require_transaction_transition(current, target)
    else:
        with pytest.raises(InvalidDealTransition):
            require_transaction_transition(current, target)


@pytest.mark.parametrize("current,target", list(itertools.product(ShipmentStatus, repeat=2)))
def test_every_shipment_transition_is_explicit(current, target):
    if target in SHIPMENT_TRANSITIONS[current]:
        require_shipment_transition(current, target)
    else:
        with pytest.raises(InvalidShipmentTransition):
            require_shipment_transition(current, target)
