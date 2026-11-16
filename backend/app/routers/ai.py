"""AI reader endpoints. Open to guests: reading without an account is allowed."""

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.config import get_settings
from app.llm import LLMError, LLMProvider, get_provider
from app.schemas.ai import AiReadingRequest, FollowUpRequest, Suggestions, SuggestionsRequest
from app.services import ai

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

NDJSON = "application/x-ndjson; charset=utf-8"


def get_llm_provider() -> LLMProvider:
    try:
        return get_provider(get_settings())
    except LLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=ai.friendly_message(exc)
        ) from exc


ProviderDep = Annotated[LLMProvider, Depends(get_llm_provider)]


def _stream(body: AsyncIterator[bytes]) -> StreamingResponse:
    return StreamingResponse(body, media_type=NDJSON, headers={"Cache-Control": "no-store"})


@router.post("/reading", response_class=StreamingResponse)
def reading(data: AiReadingRequest, provider: ProviderDep) -> StreamingResponse:
    try:
        return _stream(ai.reading_stream(provider, data))
    except ai.InvalidAiRequestError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/follow-up", response_class=StreamingResponse)
def follow_up(data: FollowUpRequest, provider: ProviderDep) -> StreamingResponse:
    try:
        return _stream(ai.follow_up_stream(provider, data))
    except ai.InvalidAiRequestError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/follow-up/suggestions", response_model=Suggestions)
async def suggestions(data: SuggestionsRequest, provider: ProviderDep) -> Suggestions:
    try:
        return await ai.suggest_follow_ups(provider, data)
    except ai.InvalidAiRequestError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
