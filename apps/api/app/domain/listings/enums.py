from enum import StrEnum


class MaterialCategory(StrEnum):
    PLASTIC = "plastic"
    METAL = "metal"
    PAPER_CARDBOARD = "paper_cardboard"
    WOOD = "wood"
    TEXTILE = "textile"
    GLASS = "glass"
    ELECTRONIC = "electronic"
    AGRO = "agro"


class MaterialCondition(StrEnum):
    CLEAN_SEPARATED = "clean_separated"
    MIXED = "mixed"
    PREPROCESSED = "preprocessed"
    NEEDS_SORTING = "needs_sorting"


class QuantityUnit(StrEnum):
    TON = "t"
    KG = "kg"
    UNIT = "unit"
    M3 = "m3"
    LITER = "l"


class Availability(StrEnum):
    IMMEDIATE = "immediate"
    THIS_WEEK = "this_week"
    THIS_MONTH = "this_month"
    SPECIFIC_DATE = "specific_date"


class PricingType(StrEnum):
    PAID = "paid"
    FREE = "free"


class ListingStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
