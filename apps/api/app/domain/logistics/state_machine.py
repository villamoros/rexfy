from app.domain.logistics.enums import ShipmentStatus


class InvalidTransition(ValueError):
    pass


SHIPMENT_TRANSITIONS: dict[ShipmentStatus, frozenset[ShipmentStatus]] = {
    ShipmentStatus.REQUESTED: frozenset({ShipmentStatus.ASSIGNED}),
    ShipmentStatus.ASSIGNED: frozenset({ShipmentStatus.PICKED_UP}),
    ShipmentStatus.PICKED_UP: frozenset({ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELIVERED}),
    ShipmentStatus.IN_TRANSIT: frozenset({ShipmentStatus.DELIVERED}),
    ShipmentStatus.DELIVERED: frozenset(),
}


def require_shipment_transition(current: ShipmentStatus, target: ShipmentStatus) -> None:
    if target not in SHIPMENT_TRANSITIONS[current]:
        raise InvalidTransition(f"No se puede cambiar un envío de {current} a {target}")
