from datetime import UTC, datetime
from uuid import uuid4

from app.schemas.readings import Reading, ReadingCreate, ReadingUpdate


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

    def update(self, user_id: str, reading_id: str, data: ReadingUpdate) -> Reading | None:
        for i, row in enumerate(self.rows):
            if row.id == reading_id and row.user_id == user_id:
                self.rows[i] = row.model_copy(update=data.model_dump(exclude_unset=True))
                self.rows[i] = Reading.model_validate(self.rows[i].model_dump())
                return self.rows[i]
        return None

    def delete(self, user_id: str, reading_id: str) -> bool:
        before = len(self.rows)
        self.rows = [r for r in self.rows if not (r.id == reading_id and r.user_id == user_id)]
        return len(self.rows) < before
