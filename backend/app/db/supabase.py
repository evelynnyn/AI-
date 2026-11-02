from supabase import Client, ClientOptions, create_client

from app.config import get_settings


def create_anon_client() -> Client:
    """Client with only the anon key, used to verify user JWTs."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


def create_user_client(access_token: str) -> Client:
    """Client that acts as the signed-in user so RLS policies apply."""
    settings = get_settings()
    options = ClientOptions(
        headers={"Authorization": f"Bearer {access_token}"},
        auto_refresh_token=False,
        persist_session=False,
    )
    return create_client(settings.supabase_url, settings.supabase_anon_key, options)
