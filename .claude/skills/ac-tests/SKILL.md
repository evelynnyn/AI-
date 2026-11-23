---
name: ac-tests
description: Write or update a user story's Given-When-Then acceptance criteria in its GitHub issue and add one test per AC, named with the AC id. Use when implementing a story, adding tests for a story, or when an issue's AC table and the tests disagree.
---

# Acceptance criteria and their tests

Each user story is a GitHub issue titled `[US-xx]` or `[SEC-xx]`. Its AC table is the contract; every test points back to one row.

## 1. The AC table in the issue

Read it with `gh issue view <n> --repo evelynnyn/AI-`. The table looks like:

| AC | 類型 | Given | When | Then | 測試 |
| --- | --- | --- | --- | --- | --- |
| AC1 | 正常 | 已登入 | 抽滿牌陣的牌 | 紀錄出現在列表 | 單元 `test_us13_ac1_*`；E2E |

Rules:
- At least one `正常` row and at least two rows of `異常`, `邊界`, `權限` or `安全`.
- `Then` must be observable (a status code, a message, what is on screen), never "works correctly".
- User-facing wording follows ARCHITECTURE.md §7 (Taiwan terms: 確認, 設定, 使用者…).
- The `測試` column names the test file or test name. Use `尚未實作` only for stories not built yet; never cite a source file as a test.
- When changing an issue, keep the old text and add a dated note line (`> 更新（YYYY-MM-DD）：…`), then `gh issue edit <n> --body-file <file>`.

## 2. One test per AC, named after it

| Layer | Where | Name |
| --- | --- | --- |
| Backend unit (pytest) | `backend/tests/unit/` | `def test_us13_ac3_wrong_card_count_returns_400(...)` |
| RLS integration | `backend/tests/integration/` (marker `integration`) | `test_us13_ac6_...` |
| Frontend unit (Vitest + RTL) | next to the code, `*.test.ts(x)` | `it("US-13 AC10: ...")` |
| E2E (Playwright) | `frontend/e2e/*.spec.ts` | `test("US-01 AC3: ...")` or `test.step("US-13 AC1: ...")` |

- A test that also proves another AC lists both: `"US-12 AC1 / US-15 AC2: ..."`, `test_us08_ac1_us12_ac4_...`.
- No test without an AC id. If a test has no AC to point at, either add the AC to the issue or delete the test.
- Assert the outcome in `Then`. Avoid vacuous checks (`is not None`, `toBeDefined()`) unless a real assertion follows.
- E2E that needs Supabase and the backend uses `test.skip(!process.env.E2E_SUPABASE, ...)`; CI sets it, so nothing is skipped there.

## 3. Prove the test can fail

Break the behaviour once (comment out the guard, flip a condition), run only that test, and see it fail. Restore the code and run it again. A test that still passes against broken code is not testing the AC.

## 4. Check the mapping both ways

```bash
# Test names that carry no AC id (should print nothing)
grep -rhE "^\s*(async )?def test_" backend/tests | grep -viE "def test_(us|sec)[0-9]+_ac"
grep -rhE "^\s*(it|test)\(" frontend/src frontend/e2e --include=*.ts --include=*.tsx | grep -vE "(US|SEC)-[0-9]+"
```

Then read the issue's AC table and confirm each implemented row has a test with that id.
