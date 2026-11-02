from datetime import UTC, datetime
from uuid import uuid4

from app.schemas.readings import Reading, ReadingCreate


class InMemoryReadingsRepository:
    def __init__(self) -> None:
        self.rows: list[Reading] = []

    def list_for_user(self, user_id: str) -> list[Reading]:
        return [row for row in reversed(self.rows) if row.user_id == user_id]

    def create(self, user_id: str, data: ReadingCreate) -> Reading:
        reading = Reading(
            id=str(uuid4()),
            user_id=user_id,
            created_at=datetime.now(UTC),
            **data.model_dump(),
        )
        self.rows.append(reading)
        return reading

    def delete(self, user_id: str, reading_id: str) -> bool:
        before = len(self.rows)
        self.rows = [r for r in self.rows if not (r.id == reading_id and r.user_id == user_id)]
        return len(self.rows) < before
