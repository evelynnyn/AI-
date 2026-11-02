import pytest

from app.schemas.readings import DrawnCard, ReadingCreate
from app.services.readings import InvalidReadingError, ReadingNotFoundError, ReadingsService
from tests.unit.fakes import InMemoryReadingsRepository


def three_card_reading() -> ReadingCreate:
    return ReadingCreate(
        question="這份工作適合我嗎？",
        spread="three_card",
        cards=[
            DrawnCard(position="過去", card_id="major-00"),
            DrawnCard(position="現在", card_id="major-01", reversed=True),
            DrawnCard(position="未來", card_id="major-17"),
        ],
    )


def test_create_and_list_only_own_readings() -> None:
    repo = InMemoryReadingsRepository()
    alice = ReadingsService(repo, "alice")
    bob = ReadingsService(repo, "bob")

    created = alice.create_reading(three_card_reading())

    assert created.reader == "high_priestess"
    assert [r.id for r in alice.list_readings()] == [created.id]
    assert bob.list_readings() == []


def test_rejects_wrong_card_count_for_spread() -> None:
    service = ReadingsService(InMemoryReadingsRepository(), "alice")
    data = three_card_reading().model_copy(update={"spread": "daily"})

    with pytest.raises(InvalidReadingError, match="1 張牌"):
        service.create_reading(data)


def test_cannot_delete_someone_elses_reading() -> None:
    repo = InMemoryReadingsRepository()
    created = ReadingsService(repo, "alice").create_reading(three_card_reading())

    with pytest.raises(ReadingNotFoundError):
        ReadingsService(repo, "bob").delete_reading(created.id)
    assert len(repo.rows) == 1
