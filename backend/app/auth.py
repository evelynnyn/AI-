from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from supabase_auth.errors import AuthError

from app.db.supabase import create_anon_client

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    id: str
    email: str | None
    access_token: str


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> CurrentUser:
    """Verify the Supabase JWT from the Authorization header."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="請先登入",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    token = credentials.credentials
    try:
        response = create_anon_client().auth.get_user(token)
    except AuthError as exc:
        raise unauthorized from exc
    if response is None:
        raise unauthorized

    return CurrentUser(id=response.user.id, email=response.user.email, access_token=token)
