from app.repositories.readings import ReadingsRepository
from app.schemas.readings import SPREAD_CARD_COUNT, Reading, ReadingCreate


class InvalidReadingError(ValueError):
    pass


class ReadingNotFoundError(LookupError):
    pass


class ReadingsService:
    def __init__(self, repository: ReadingsRepository, user_id: str) -> None:
        self._repository = repository
        self._user_id = user_id

    def list_readings(self) -> list[Reading]:
        return self._repository.list_for_user(self._user_id)

    def create_reading(self, data: ReadingCreate) -> Reading:
        expected = SPREAD_CARD_COUNT[data.spread]
        if len(data.cards) != expected:
            raise InvalidReadingError(f"此牌陣需要 {expected} 張牌")
        return self._repository.create(self._user_id, data)

    def delete_reading(self, reading_id: str) -> None:
        if not self._repository.delete(self._user_id, reading_id):
            raise ReadingNotFoundError("找不到這筆占卜紀錄")
