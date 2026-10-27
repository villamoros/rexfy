from enum import StrEnum


class VehicleType(StrEnum):
    SINGLE_TRUCK = "single_truck"  # camión sencillo, hasta 5 t
    DOUBLE_AXLE = "double_axle"  # doble troque, 5 a 15 t
    TRACTOR_TRAILER = "tractor_trailer"  # tractomula, más de 15 t
    BULK = "bulk"  # granel o especial
    SPECIAL = "special"  # carga especial


class ShipmentStatus(StrEnum):
    REQUESTED = "requested"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"


# The order a shipment moves through once a transporter is assigned.
SHIPMENT_FLOW = [
    ShipmentStatus.ASSIGNED,
    ShipmentStatus.PICKED_UP,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.DELIVERED,
]


class QuoteStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
