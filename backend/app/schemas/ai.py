"""Requests for the AI reader. The frontend sends only ids and the question (SEC-03);
card names, keywords and prompts are looked up on the server."""

from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

from app.catalog import ReaderId, SpreadId

MAX_FOLLOW_UPS = 5

Question = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


class AiCard(BaseModel):
    card_id: str = Field(min_length=1, max_length=40)
    reversed: bool = False


class FollowUpTurn(BaseModel):
    question: Question
    answer: str = Field(min_length=1, max_length=2000)


class AiReadingRequest(BaseModel):
    reader: ReaderId = "high-priestess"
    spread: SpreadId
    question: Question
    cards: list[AiCard] = Field(min_length=1, max_length=9)


class SuggestionsRequest(AiReadingRequest):
    ai_reading: str = Field(min_length=1, max_length=4000)


class FollowUpRequest(SuggestionsRequest):
    history: list[FollowUpTurn] = Field(default_factory=list)
    follow_up: Question


class Suggestions(BaseModel):
    suggestions: list[str]
    # False when the AI failed and generic questions were used instead (US-10).
    generated: bool
