"""Requests for the AI reader. The frontend sends only ids and the question (SEC-03);
card names, keywords and prompts are looked up on the server."""

from pydantic import BaseModel, Field

from app.catalog import ReaderId, SpreadId
from app.schemas.readings import Question


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
