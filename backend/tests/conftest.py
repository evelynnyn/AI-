import os

# Settings are read at import time; give unit tests harmless defaults.
os.environ.setdefault("SUPABASE_URL", "http://127.0.0.1:54321")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")
