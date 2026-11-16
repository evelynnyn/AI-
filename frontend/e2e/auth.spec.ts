import { expect, test } from "@playwright/test";

// Each test and step names the acceptance criterion it checks (see the GitHub issues).

test("US-29 AC1: reading history requires login", async ({ page }) => {
  await page.goto("/readings");

  await expect(page).toHaveURL(/\/login\?next=%2Freadings/);
  await expect(
    page.getByRole("button", { name: "使用 Google 帳號登入" }),
  ).toBeVisible();
});

// Full flow: needs `supabase start` and the backend running (see README).
test("US-29 / US-13 / US-30: sign up, save and delete a reading, then sign out", async ({
  page,
}, testInfo) => {
  test.skip(
    !process.env.E2E_SUPABASE,
    "set E2E_SUPABASE=1 with local Supabase + backend running",
  );

  // Projects run in parallel, so include the project name to keep emails unique.
  const email = `e2e-${testInfo.project.name}-${Date.now()}@example.com`;
  const question = "這個月的感情運勢如何？";

  await test.step("US-29 AC3: a new user signs up and lands on the readings page", async () => {
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

  const saved = page.getByRole("listitem").filter({ hasText: question });

  await test.step("US-13 AC1: the saved reading appears with its details", async () => {
    await page.getByLabel("你想問什麼？").fill(question);
    await page.getByLabel("牌陣").selectOption("three_card");
    await page.getByLabel("解讀師").selectOption("magician");
    await page.getByRole("button", { name: "抽牌並保存" }).click();

    await expect(saved).toBeVisible();
    await expect(saved.getByText("三張牌陣")).toBeVisible();
    await expect(saved.getByText("解讀師：魔術師")).toBeVisible();
    await expect(saved.getByText("過去：")).toBeVisible();
    await expect(saved.getByText("現在：")).toBeVisible();
    await expect(saved.getByText("未來：")).toBeVisible();
  });

  await test.step("US-13 AC1: the reading is still there after a reload", async () => {
    await page.reload();
    await expect(saved).toBeVisible();
  });

  await test.step("US-30 AC1: deleting the reading removes it", async () => {
    page.once("dialog", (dialog) => dialog.accept());
    await saved.getByRole("button", { name: "刪除" }).click();
    await expect(saved).toHaveCount(0);
    await expect(page.getByText("還沒有占卜紀錄")).toBeVisible();
  });

  await test.step("US-29 AC9: signing out returns to the signed-out header", async () => {
    await page.getByRole("button", { name: "登出" }).click();
    await expect(page.getByRole("link", { name: "登入" })).toBeVisible();
  });
});
