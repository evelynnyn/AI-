import { expect, test } from "@playwright/test";

test("reading history requires login", async ({ page }) => {
  await page.goto("/readings");

  await expect(page).toHaveURL(/\/login\?next=%2Freadings/);
  await expect(
    page.getByRole("button", { name: "使用 Google 帳號登入" }),
  ).toBeVisible();
});

// Full flow: needs `supabase start` and the backend running (see README).
test("sign up, save a reading, then sign out", async ({ page }, testInfo) => {
  test.skip(
    !process.env.E2E_SUPABASE,
    "set E2E_SUPABASE=1 with local Supabase + backend running",
  );

  // Projects run in parallel, so include the project name to keep emails unique.
  const email = `e2e-${testInfo.project.name}-${Date.now()}@example.com`;
  await page.goto("/login");
  await page.getByRole("button", { name: "建立帳號" }).click();
  await page.getByLabel("電子郵件").fill(email);
  await page.getByLabel("密碼").fill("e2e-password-123");
  await page.getByRole("button", { name: "註冊" }).click();

  await expect(page).toHaveURL(/\/readings/);
  await expect(page.getByText("還沒有占卜紀錄")).toBeVisible();

  await page.getByLabel("你想問什麼？").fill("這個月的感情運勢如何？");
  await page.getByRole("button", { name: "抽牌並保存" }).click();
  await expect(page.getByText("這個月的感情運勢如何？")).toBeVisible();

  await page.getByRole("button", { name: "登出" }).click();
  await expect(page.getByRole("link", { name: "登入" })).toBeVisible();
});
