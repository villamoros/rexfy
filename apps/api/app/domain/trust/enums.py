from enum import StrEnum


class DisputeReason(StrEnum):
    QUALITY = "quality"  # el material no es el acordado
    QUANTITY = "quantity"  # llegó menos de lo acordado
    DELIVERY = "delivery"  # no llegó o llegó tarde
    PAYMENT = "payment"  # pago pendiente o incompleto
    OTHER = "other"


class DisputeStatus(StrEnum):
    OPEN = "open"
    RESOLVED = "resolved"
