import { expect, test } from "@playwright/test";

import { drawCards } from "./reading";

// Each test and step names the acceptance criterion it checks (see the GitHub issues).

test("US-29 AC1: guests can open history and are offered to sign in", async ({
  page,
}) => {
  await page.goto("/readings");

  await expect(page.getByRole("heading", { name: "占卜紀錄" })).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: "登入" }),
  ).toHaveAttribute("href", "/login?next=%2Freadings");
});

// Full flow: needs `supabase start` and the backend running (see README).
test("US-29 / US-13 / US-30: sign up, save a three-card reading to the account, delete it, sign out", async ({
  page,
}, testInfo) => {
  test.skip(
    !process.env.E2E_SUPABASE,
    "set E2E_SUPABASE=1 with local Supabase + backend running",
  );

  // Projects run in parallel, so include the project name to keep emails unique.
  const email = `e2e-${testInfo.project.name}-${Date.now()}@example.com`;
  const question = "這個月的感情運勢如何？";

  await test.step("US-29 AC3: a new user signs up and lands on the history page", async () => {
    await page.goto("/login");
    await page.getByRole("button", { name: "建立帳號" }).click();
    await page.getByLabel("電子郵件").fill(email);
    await page.getByLabel("密碼").fill("e2e-password-123");
    await page.getByRole("button", { name: "註冊" }).click();
    await expect(page).toHaveURL(/\/readings/);
  });

  await test.step("US-13 AC7: an empty history shows the empty state", async () => {
    await expect(page.getByText("還沒有占卜紀錄")).toBeVisible();
  });

  await test.step("US-13 AC1: a three-card reading is drawn and saved", async () => {
    await page.goto("/reading/three");
    await page.getByLabel("你想問什麼？").fill(question);
    await drawCards(page, 3);
    await expect(
      page
        .getByRole("region", { name: "解讀師的話" })
        .getByText("測試用的假解讀"),
    ).toBeVisible({ timeout: 15_000 });
  });

  const saved = page.getByRole("listitem").filter({ hasText: question });

  await test.step("US-13 AC1 / US-14 AC1: the reading is in the account's history", async () => {
    await page.goto("/readings");
    await expect(page.getByText("紀錄保存在你的帳號中")).toBeVisible();
    await expect(saved).toBeVisible();
    await expect(saved.getByText("三張牌陣")).toBeVisible();
    await saved.getByRole("button", { name: new RegExp(question) }).click();
    await expect(saved.getByText("測試用的假解讀")).toBeVisible();
  });

  await test.step("US-30 AC1: deleting the reading removes it", async () => {
    page.once("dialog", (dialog) => dialog.accept());
    await saved.getByRole("button", { name: "刪除這筆紀錄" }).click();
    await expect(saved).toHaveCount(0);
    await expect(page.getByText("還沒有占卜紀錄")).toBeVisible();
  });

  await test.step("US-29 AC9: signing out returns to the signed-out header", async () => {
    await page.getByRole("button", { name: "登出" }).click();
    await expect(page.getByRole("banner").getByRole("link", { name: "登入" })).toBeVisible();
  });
});
