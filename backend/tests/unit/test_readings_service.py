"""Service tests. Each test name starts with the acceptance criterion it checks."""

import pytest

from app.schemas.readings import DrawnCard, ReadingCreate
from app.services.readings import InvalidReadingError, ReadingNotFoundError, ReadingsService
from tests.unit.fakes import InMemoryReadingsRepository


def three_card_reading() -> ReadingCreate:
    return ReadingCreate(
        question="這份工作適合我嗎？",
        spread="three",
        cards=[
            DrawnCard(position="past", card_id="fool"),
            DrawnCard(position="present", card_id="magician", reversed=True),
            DrawnCard(position="future", card_id="star"),
        ],
    )


def test_us13_ac1_saves_reading_with_default_reader() -> None:
    service = ReadingsService(InMemoryReadingsRepository(), "alice")

    created = service.create_reading(three_card_reading())

    assert created.reader == "high-priestess"
    assert created.cards[1] == DrawnCard(position="present", card_id="magician", reversed=True)
    assert [r.id for r in service.list_readings()] == [created.id]


@pytest.mark.parametrize(("spread", "expected"), [("daily", 1), ("three", 3)])
def test_us13_ac3_rejects_wrong_card_count_for_spread(spread: str, expected: int) -> None:
    repo = InMemoryReadingsRepository()
    service = ReadingsService(repo, "alice")
    cards = three_card_reading().cards if spread == "daily" else three_card_reading().cards[:1]
    data = three_card_reading().model_copy(update={"spread": spread, "cards": cards})

    with pytest.raises(InvalidReadingError, match=f"{expected} 張牌"):
        service.create_reading(data)
    assert repo.rows == []


def test_us13_ac5_users_only_see_their_own_readings() -> None:
    repo = InMemoryReadingsRepository()
    alice = ReadingsService(repo, "alice")
    alice.create_reading(three_card_reading())

    assert ReadingsService(repo, "bob").list_readings() == []


def test_us30_ac3_cannot_delete_someone_elses_reading() -> None:
    repo = InMemoryReadingsRepository()
    created = ReadingsService(repo, "alice").create_reading(three_card_reading())

    with pytest.raises(ReadingNotFoundError):
        ReadingsService(repo, "bob").delete_reading(created.id)
    assert [r.id for r in repo.rows] == [created.id]
