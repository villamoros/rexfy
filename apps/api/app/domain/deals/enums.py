from enum import StrEnum


class OfferStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    COUNTERED = "countered"


class TransactionStatus(StrEnum):
    AGREED = "agreed"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    COMPLETED = "completed"
