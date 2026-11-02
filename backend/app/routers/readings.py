from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import CurrentUser, get_current_user
from app.db.supabase import create_user_client
from app.repositories.readings import ReadingsRepository, SupabaseReadingsRepository
from app.schemas.readings import Reading, ReadingCreate
from app.services.readings import InvalidReadingError, ReadingNotFoundError, ReadingsService

router = APIRouter(prefix="/api/v1/readings", tags=["readings"])

UserDep = Annotated[CurrentUser, Depends(get_current_user)]


def get_readings_repository(user: UserDep) -> ReadingsRepository:
    return SupabaseReadingsRepository(create_user_client(user.access_token))


def get_readings_service(
    user: UserDep,
    repository: Annotated[ReadingsRepository, Depends(get_readings_repository)],
) -> ReadingsService:
    return ReadingsService(repository, user.id)


ServiceDep = Annotated[ReadingsService, Depends(get_readings_service)]


@router.get("", response_model=list[Reading])
def list_readings(service: ServiceDep) -> list[Reading]:
    return service.list_readings()


@router.post("", response_model=Reading, status_code=status.HTTP_201_CREATED)
def create_reading(data: ReadingCreate, service: ServiceDep) -> Reading:
    try:
        return service.create_reading(data)
    except InvalidReadingError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/{reading_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reading(reading_id: UUID, service: ServiceDep) -> None:
    try:
        service.delete_reading(str(reading_id))
    except ReadingNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
