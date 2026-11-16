"""Static tarot / Lenormand data: cards, spreads, readers and art scenes.

The JSON files here are the source of truth. `frontend/src/data/` keeps copies of the
card and spread files for display; a frontend test fails if they drift apart.
Reader system prompts and art scenes stay server-side only (SEC-03).
"""

import json
from functools import cache
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, TypeAdapter

DeckId = Literal["tarot", "lenormand"]
SpreadId = Literal["daily", "three", "lenormand-three", "lenormand-nine"]
ReaderId = Literal["high-priestess", "magician", "fool"]
Orientation = Literal["upright", "reversed"]

DATA_DIR = Path(__file__).parent


class Card(BaseModel):
    id: str
    nameZh: str
    nameEn: str
    image: str | None = None
    # Tarot cards have separate upright / reversed meanings; Lenormand cards have one.
    uprightKeywords: list[str] = []
    reversedKeywords: list[str] = []
    keywords: list[str] = []

    def keywords_for(self, orientation: Orientation) -> list[str]:
        if self.keywords:
            return self.keywords
        return self.reversedKeywords if orientation == "reversed" else self.uprightKeywords


class Deck(BaseModel):
    id: DeckId
    nameZh: str
    nameEn: str
    supports_reversed: bool
    cards: dict[str, Card]


class SpreadPosition(BaseModel):
    id: str
    label: str
    meaning: str


class Spread(BaseModel):
    id: SpreadId
    deckId: DeckId
    nameZh: str
    positions: list[SpreadPosition]
    columns: int | None = None
    defaultQuestion: str


class Reader(BaseModel):
    id: ReaderId
    name: str
    systemPrompt: str


def _load(name: str) -> object:
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


@cache
def decks() -> dict[DeckId, Deck]:
    cards = TypeAdapter(list[Card])
    tarot = cards.validate_python(_load("tarot_cards.json"))
    lenormand = cards.validate_python(_load("lenormand_cards.json"))
    return {
        "tarot": Deck(
            id="tarot",
            nameZh="塔羅牌",
            nameEn="Tarot",
            supports_reversed=True,
            cards={c.id: c for c in tarot},
        ),
        "lenormand": Deck(
            id="lenormand",
            nameZh="雷諾曼",
            nameEn="Lenormand",
            supports_reversed=False,
            cards={c.id: c for c in lenormand},
        ),
    }


@cache
def spreads() -> dict[SpreadId, Spread]:
    items = TypeAdapter(list[Spread]).validate_python(_load("spreads.json"))
    return {s.id: s for s in items}


@cache
def readers() -> dict[ReaderId, Reader]:
    items = TypeAdapter(list[Reader]).validate_python(_load("readers.json"))
    return {r.id: r for r in items}


@cache
def art_scenes() -> dict[str, str]:
    return TypeAdapter(dict[str, str]).validate_python(_load("tarot_art_scenes.json"))


def art_scene(card: Card) -> str | None:
    """Only cards whose illustration is shown on the site get a scene description."""
    return art_scenes().get(card.id) if card.image else None
