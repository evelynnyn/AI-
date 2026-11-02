from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/me", tags=["me"])


class Me(BaseModel):
    id: str
    email: str | None


@router.get("", response_model=Me)
def read_me(user: Annotated[CurrentUser, Depends(get_current_user)]) -> Me:
    return Me(id=user.id, email=user.email)
