from typing import Protocol

from supabase import Client

from app.schemas.readings import Reading, ReadingCreate

TABLE = "readings"


class ReadingsRepository(Protocol):
    def list_for_user(self, user_id: str) -> list[Reading]: ...

    def create(self, user_id: str, data: ReadingCreate) -> Reading: ...

    def delete(self, user_id: str, reading_id: str) -> bool: ...


class SupabaseReadingsRepository:
    """Queries `readings` with a user-scoped client, so RLS also enforces ownership."""

    def __init__(self, client: Client) -> None:
        self._client = client

    def list_for_user(self, user_id: str) -> list[Reading]:
        response = (
            self._client.table(TABLE)
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return [Reading.model_validate(row) for row in response.data]

    def create(self, user_id: str, data: ReadingCreate) -> Reading:
        payload = {**data.model_dump(mode="json"), "user_id": user_id}
        response = self._client.table(TABLE).insert(payload).execute()
        return Reading.model_validate(response.data[0])

    def delete(self, user_id: str, reading_id: str) -> bool:
        response = (
            self._client.table(TABLE).delete().eq("id", reading_id).eq("user_id", user_id).execute()
        )
        return len(response.data) > 0
