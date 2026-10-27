from enum import StrEnum


class MarketRole(StrEnum):
    """What a company does on the marketplace. A company can hold more than one."""

    GENERATOR = "generator"
    BUYER = "buyer"
    TRANSPORTER = "transporter"


class MemberRole(StrEnum):
    """A user's permissions inside one company.

    Members do the daily work (publish, chat, quote, request transport). Owners and admins
    also commit the company: accept quotes, pick transporters, close orders and manage the
    team. There is one owner, who cannot be removed.
    """

    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"

    @property
    def can_commit(self) -> bool:
        return self in (MemberRole.OWNER, MemberRole.ADMIN)
