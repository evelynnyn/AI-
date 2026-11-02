from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Spread = Literal["daily", "three_card"]
Reader = Literal["high_priestess", "magician", "fool"]

SPREAD_CARD_COUNT: dict[Spread, int] = {"daily": 1, "three_card": 3}
MAX_FOLLOW_UPS = 5

# Card ids follow cards.json (US-19): "major-00" .. "major-21", "wands-01" .. "pentacles-14".
CARD_ID_PATTERN = r"^(major-(0\d|1\d|2[01])|(wands|cups|swords|pentacles)-(0[1-9]|1[0-4]))$"


class DrawnCard(BaseModel):
    position: str = Field(min_length=1, max_length=20)
    card_id: str = Field(pattern=CARD_ID_PATTERN)
    reversed: bool = False


class FollowUp(BaseModel):
    question: str = Field(min_length=1, max_length=200)
    answer: str = Field(max_length=5_000)


class ReadingCreate(BaseModel):
    question: str = Field(min_length=1, max_length=200)
    spread: Spread
    reader: Reader = "high_priestess"
    cards: list[DrawnCard] = Field(min_length=1, max_length=3)
    interpretation: str | None = Field(default=None, max_length=10_000)
    follow_ups: list[FollowUp] = Field(default_factory=list, max_length=MAX_FOLLOW_UPS)


class Reading(BaseModel):
    id: str
    user_id: str
    question: str
    spread: Spread
    reader: Reader
    cards: list[DrawnCard]
    interpretation: str | None
    follow_ups: list[FollowUp]
    created_at: datetime
