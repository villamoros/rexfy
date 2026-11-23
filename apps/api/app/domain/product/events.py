from enum import StrEnum


class ProductEventName(StrEnum):
    USER_REGISTERED = "user.registered"
    COMPANY_CREATED = "company.created"
    LISTING_PUBLISHED = "listing.published"
    CONTACT_STARTED = "contact.started"
    OFFER_SENT = "offer.sent"
    ORDER_CREATED = "order.created"
    SHIPMENT_DELIVERED = "shipment.delivered"


SCHEMA_VERSION = 1
