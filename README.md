# 星語塔羅

Next.js 前端 + FastAPI 後端 + Supabase（登入、資料庫）。架構見 [ARCHITECTURE.md](ARCHITECTURE.md)。

## Local setup

1. Start Docker Desktop, then start local Supabase (applies `supabase/migrations`):
   ```bash
   npx supabase start
   ```
   Copy `API URL` and `anon key` from the output.
2. Backend:
   ```bash
   cd backend
   uv venv --python 3.12 .venv && uv pip install --python .venv -r requirements.txt
   cp .env.example .env   # fill SUPABASE_URL, SUPABASE_ANON_KEY
   .venv/Scripts/uvicorn app.main:app --reload --port 8000
   ```
3. Frontend:
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local   # fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
   npm run dev
   ```
4. Open http://localhost:3000, create an account, and save a reading at `/readings`.

## Cloud Supabase

Create a project at supabase.com (region: Asia-Pacific), then:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Google sign-in: enable the Google provider under Authentication > Providers and add
`http://localhost:3000/auth/callback` to the redirect URLs.

## Checks

- Backend: `ruff check . && ruff format --check . && mypy app && pytest`
- Frontend: `npm run lint && npm run typecheck && npm test && npx playwright test`
- After API changes: `npm run gen:api` in `frontend/`
- Full E2E locally (needs Docker): `npx supabase start`, run the backend, then `E2E_SUPABASE=1 npx playwright test` in `frontend/`.
  Local test users stay in the local database; `npx supabase db reset` clears them.

## CI

GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs on every pull request and push to `main`:

| Job | What it runs |
| --- | --- |
| Backend lint, types, unit tests | `ruff`, `mypy`, `pytest -m "not integration"` |
| Frontend lint, types, unit tests | `npm run lint`, `npm run typecheck`, `npm test` |
| RLS integration and Playwright E2E | `supabase start` in the runner, `pytest -m integration`, then Playwright against the production build |

The E2E job uses a throwaway Supabase inside the runner, so it needs no repository secrets and leaves no test data behind.
To block merging on failures, mark these three checks as required under Settings > Rules (or Branches) for `main`.
