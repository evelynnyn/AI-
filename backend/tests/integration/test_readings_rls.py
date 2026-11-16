"""RLS checks against a local Supabase. Run `supabase start` first, then put the
local URL and anon key in backend/.env. Each test name starts with the acceptance
criteria it checks (see the GitHub issues)."""

from uuid import uuid4

import httpx
import pytest
from supabase import create_client

from app.config import get_settings
from app.db.supabase import create_user_client
from app.repositories.readings import SupabaseReadingsRepository
from app.schemas.readings import DrawnCard, FollowUp, ReadingCreate, ReadingUpdate

pytestmark = pytest.mark.integration


def supabase_is_running() -> bool:
    settings = get_settings()
    try:
        response = httpx.get(
            f"{settings.supabase_url}/auth/v1/health",
            headers={"apikey": settings.supabase_anon_key},
            timeout=2,
        )
    except httpx.HTTPError:
        return False
    return response.status_code == 200


if not supabase_is_running():
    pytest.skip("local Supabase is not running", allow_module_level=True)


def sign_up() -> tuple[str, str]:
    settings = get_settings()
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    response = client.auth.sign_up(
        {"email": f"rls-{uuid4().hex[:8]}@example.com", "password": "test-password-123"}
    )
    assert response.user is not None and response.session is not None
    return response.user.id, response.session.access_token


def test_us13_ac5_us30_ac3_user_cannot_read_or_delete_other_users_readings() -> None:
    alice_id, alice_token = sign_up()
    bob_id, bob_token = sign_up()
    alice_repo = SupabaseReadingsRepository(create_user_client(alice_token))
    bob_repo = SupabaseReadingsRepository(create_user_client(bob_token))

    reading = alice_repo.create(
        alice_id,
        ReadingCreate(
            question="RLS 測試",
            spread="daily",
            cards=[DrawnCard(position="today", card_id="moon")],
        ),
    )

    assert [r.id for r in alice_repo.list_for_user(alice_id)] == [reading.id]
    # Even when asking for Alice's rows explicitly, RLS returns nothing to Bob.
    assert bob_repo.list_for_user(alice_id) == []
    assert bob_repo.delete(alice_id, reading.id) is False
    assert len(alice_repo.list_for_user(alice_id)) == 1


def test_us13_ac6_user_cannot_insert_rows_for_someone_else() -> None:
    alice_id, _ = sign_up()
    _, bob_token = sign_up()
    bob_repo = SupabaseReadingsRepository(create_user_client(bob_token))

    with pytest.raises(Exception, match="row-level security"):
        bob_repo.create(
            alice_id,
            ReadingCreate(
                question="冒用別人",
                spread="daily",
                cards=[DrawnCard(position="today", card_id="devil")],
            ),
        )


def test_us14_ac1_ac2_owner_can_update_but_others_cannot() -> None:
    alice_id, alice_token = sign_up()
    bob_id, bob_token = sign_up()
    alice_repo = SupabaseReadingsRepository(create_user_client(alice_token))
    bob_repo = SupabaseReadingsRepository(create_user_client(bob_token))
    reading = alice_repo.create(
        alice_id,
        ReadingCreate(
            question="追問保存",
            spread="daily",
            cards=[DrawnCard(position="today", card_id="star")],
        ),
    )

    tampered = bob_repo.update(bob_id, reading.id, ReadingUpdate(interpretation="竄改"))
    updated = alice_repo.update(
        alice_id,
        reading.id,
        ReadingUpdate(
            interpretation="星星說……",
            follow_ups=[FollowUp(question="然後呢？", answer="慢慢來。")],
        ),
    )

    assert tampered is None
    assert updated is not None
    assert updated.interpretation == "星星說……"
    assert updated.follow_ups == [FollowUp(question="然後呢？", answer="慢慢來。")]
    assert alice_repo.list_for_user(alice_id)[0].interpretation == "星星說……"
