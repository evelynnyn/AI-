from app.catalog import decks, spreads
from app.repositories.readings import ReadingsRepository
from app.schemas.readings import Reading, ReadingCreate, ReadingUpdate


class InvalidReadingError(ValueError):
    pass


class ReadingNotFoundError(LookupError):
    pass


def check_cards(data: ReadingCreate) -> ReadingCreate:
    """Cards must fill the spread's positions in order, from the spread's deck, without repeats."""
    spread = spreads()[data.spread]
    deck = decks()[spread.deckId]
    expected = [p.id for p in spread.positions]
    if len(data.cards) != len(expected):
        raise InvalidReadingError(f"此牌陣需要 {len(expected)} 張牌")
    if [c.position for c in data.cards] != expected:
        raise InvalidReadingError("牌的位置與牌陣不符")
    if len({c.card_id for c in data.cards}) != len(data.cards):
        raise InvalidReadingError("同一張牌不能出現兩次")
    if any(c.card_id not in deck.cards for c in data.cards):
        raise InvalidReadingError("找不到這張牌")
    if not deck.supports_reversed:
        cards = [c.model_copy(update={"reversed": False}) for c in data.cards]
        return data.model_copy(update={"cards": cards})
    return data


class ReadingsService:
    def __init__(self, repository: ReadingsRepository, user_id: str) -> None:
        self._repository = repository
        self._user_id = user_id

    def list_readings(self) -> list[Reading]:
        return self._repository.list_for_user(self._user_id)

    def create_reading(self, data: ReadingCreate) -> Reading:
        return self._repository.create(self._user_id, check_cards(data))

    def update_reading(self, reading_id: str, data: ReadingUpdate) -> Reading:
        updated = self._repository.update(self._user_id, reading_id, data)
        if updated is None:
            raise ReadingNotFoundError("找不到這筆占卜紀錄")
        return updated

    def delete_reading(self, reading_id: str) -> None:
        if not self._repository.delete(self._user_id, reading_id):
            raise ReadingNotFoundError("找不到這筆占卜紀錄")
