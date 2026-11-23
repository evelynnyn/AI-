---
name: pr-review
description: Review a pull request against the course's four gates (acceptance criteria, test alignment, real CI runs, merge decision) plus ARCHITECTURE.md rules, and report pass or fail per item. Use when asked to review a PR, check whether a PR is ready to merge, or prepare a PR for the teacher's review.
---

# PR review: four gates

Target: a PR number in `evelynnyn/AI-` (`gh pr view <n> --repo evelynnyn/AI-`). Report each item as ✅ or ❌ with the evidence (issue number, test name, CI run link). Do not approve or merge on the user's behalf.

## Gate 1: requirements and acceptance criteria

For every issue the PR refers to (`Refs #…` / `Closes #…` in the body):
- [ ] The issue has a Given-When-Then table (`gh issue view <n> --json body`).
- [ ] At least one `正常` row and at least two `異常`/`邊界`/`權限`/`安全` rows.

## Gate 2: tests match the ACs

- [ ] Every test case names an AC id, and every implemented AC has a test (see the `ac-tests` skill for the commands).
- [ ] Unit tests cover boundaries and errors (length limits, blank input, 400/401/404/422, duplicates).
- [ ] E2E / integration tests run the real data flow: local Supabase, the FastAPI backend, the browser (`frontend/e2e`, `backend/tests/integration`).
- [ ] No vacuous asserts (`assert x is not None` alone, `toBeDefined()`, `toBeTruthy()` alone) and no circular tests that only check a mock returns what it was given.

## Gate 3: tests really ran

- [ ] `gh pr checks <n> --repo evelynnyn/AI-`: all three required checks pass
      (Backend lint, types, unit tests / Frontend lint, types, unit tests / RLS integration and Playwright E2E).
- [ ] Nothing skipped: open the run log (`gh run view <run-id> --log`) and confirm the pytest, Vitest and Playwright summaries show `0 skipped` (or no `skipped` at all).
- [ ] No `.only`, `.skip`, `xfail` or `@pytest.mark.skip` added in the diff (`gh pr diff <n>`).

## ARCHITECTURE.md spot checks (read the diff)

- Frontend calls the backend only through `src/lib/api/client.ts`; never queries Supabase tables.
- Backend goes `routers → services → repositories`; only repositories touch Supabase.
- No color literals in components; Server Components unless interaction needs `"use client"`.
- User-facing text in Traditional Chinese (Taiwan terms, ARCHITECTURE.md §7); code and comments in English.
- No `.env*`, keys or `service_role` in the diff; schema changes come as a new file in `supabase/migrations/`.

## Gate 4: decision

Summarise with one of:
- **Request Changes**: list each failed item and what to fix.
- **Approve**: all four gates pass. Remind the user that `main` needs one approving review from a collaborator other than the author, and squash merge only. Stacked PRs merge in order; after each merge the next PR is retargeted to `main` and CI runs again.
