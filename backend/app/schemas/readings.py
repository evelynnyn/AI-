from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

from app.catalog import ReaderId, SpreadId

MAX_FOLLOW_UPS = 5
MAX_SUGGESTIONS = 3

# US-02 AC3: a question of only spaces is blank, so strip before checking the length.
Question = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


class DrawnCard(BaseModel):
    # Position id from the spread (e.g. "past"); card id from backend/app/catalog.
    position: str = Field(min_length=1, max_length=20)
    card_id: str = Field(min_length=1, max_length=40)
    reversed: bool = False


class FollowUp(BaseModel):
    question: Question
    answer: str = Field(max_length=5_000)


class ReadingCreate(BaseModel):
    question: Question
    spread: SpreadId
    reader: ReaderId = "high-priestess"
    cards: list[DrawnCard] = Field(min_length=1, max_length=9)
    interpretation: str | None = Field(default=None, max_length=10_000)
    suggestions: list[str] = Field(default_factory=list, max_length=MAX_SUGGESTIONS)
    follow_ups: list[FollowUp] = Field(default_factory=list, max_length=MAX_FOLLOW_UPS)


class ReadingUpdate(BaseModel):
    """Fields filled in after the cards are drawn (US-14). Omitted fields stay as they are."""

    interpretation: str | None = Field(default=None, max_length=10_000)
    suggestions: list[str] | None = Field(default=None, max_length=MAX_SUGGESTIONS)
    follow_ups: list[FollowUp] | None = Field(default=None, max_length=MAX_FOLLOW_UPS)


class Reading(BaseModel):
    id: str
    user_id: str
    question: str
    spread: SpreadId
    reader: ReaderId
    cards: list[DrawnCard]
    interpretation: str | None
    suggestions: list[str]
    follow_ups: list[FollowUp]
    created_at: datetime
