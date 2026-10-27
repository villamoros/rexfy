from enum import StrEnum


class MarketRole(StrEnum):
    """What a company does on the marketplace. A company can hold more than one."""

    GENERATOR = "generator"
    BUYER = "buyer"
    TRANSPORTER = "transporter"


class MemberRole(StrEnum):
    """A user's permissions inside one company."""

    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
