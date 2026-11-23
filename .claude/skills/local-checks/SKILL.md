---
name: local-checks
description: Run every check that CI runs, on this machine - lint, types, unit tests, RLS integration tests against local Supabase, and the full Playwright E2E with the mock AI backend. Use before pushing, when CI fails and needs reproducing, or when asked to run the tests or start the app locally.
---

# Run all checks locally

Same steps as `.github/workflows/ci.yml`. Run from the repository root unless a step says otherwise.

## 1. Fast checks (no Docker needed)

```bash
cd backend && ruff check . && ruff format --check . && mypy app && pytest tests/unit
cd frontend && npm run lint && npm run typecheck && npm test
```

Activate the venv first (`source backend/.venv/bin/activate` on macOS, `backend\.venv\Scripts\activate` on Windows).

## 2. Local Supabase

Docker Desktop must be running.

```bash
npx supabase start -x studio,edge-runtime,mailpit,imgproxy
npx supabase db reset        # applies supabase/migrations and seed.sql
```

- Studio and edge-runtime are excluded because Docker cannot mount the project path under `/Applications`.
- `db reset` wipes local data only. Never run `db reset` or `db push` against the cloud project without asking.

## 3. RLS integration tests

```bash
cd backend && pytest -m integration
```

These skip themselves when Supabase is not running; a skip here means step 2 did not work.

## 4. Backend with the mock AI, then E2E

```bash
cd backend && LLM_PROVIDER=mock MOCK_LLM_DELAY=0 uvicorn app.main:app --port 8000   # leave running
cd frontend && E2E_SUPABASE=1 npx playwright test
```

- Playwright reuses `npm run dev` on port 3000 if it is already up, otherwise starts it.
- Without `E2E_SUPABASE=1` the full-flow tests skip; CI always sets it.
- The first run on the dev server compiles pages slowly; local runs allow 90 s per test.

## 5. Report

Give the pass/fail counts from each step (pytest, Vitest, Playwright). If something fails, show the failing test name and the first error lines, reproduce with only that test, and fix the cause rather than adding a skip or a longer timeout.

## Cloud database

The cloud project is linked (`supabase/.temp/project-ref`). New migrations reach it with `npx supabase db push --remote` - run `--dry-run` first and ask the user before pushing.
