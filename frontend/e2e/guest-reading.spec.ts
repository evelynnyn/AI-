import { expect, test } from "@playwright/test";

import { drawCards } from "./reading";

// Each test and step names the acceptance criterion it checks (see the GitHub issues).
// Needs the backend with LLM_PROVIDER=mock (see README); Supabase is not used by guests.

test("guest: daily card, AI reading, follow-up, then history", async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_SUPABASE,
    "set E2E_SUPABASE=1 with the backend running (LLM_PROVIDER=mock)",
  );

  await test.step("US-01 AC1: the home page lists the spreads by deck", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /塔羅牌/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /雷諾曼/ })).toBeVisible();
    await page.getByRole("link", { name: /每日一牌/ }).click();
    // The dev server compiles the page on first visit, so allow extra time.
    await expect(page).toHaveURL(/\/reading\/daily$/, { timeout: 30_000 });
  });

  await test.step("US-02 AC5 / US-07 AC1: pick an example question and a reader", async () => {
    await page.getByRole("button", { name: "今天我需要留意什麼？" }).click();
    await page.getByRole("radio", { name: /魔術師/ }).click();
  });

  await test.step("US-03 / US-04 / US-05: shuffle, pick from the fan and flip", async () => {
    await drawCards(page, 1);
  });

  await test.step("US-06 AC1: each card shows its position meaning and keywords", async () => {
    await expect(page.getByText("綜合解讀")).toBeVisible();
    await expect(page.getByText("今天值得留意的能量與提醒")).toBeVisible();
  });

  await test.step("US-08 AC1 / US-11 AC3: the AI reading streams in, marked as AI", async () => {
    const reader = page.getByRole("region", { name: "解讀師的話" });
    await expect(reader.getByText("測試用的假解讀")).toBeVisible({
      timeout: 15_000,
    });
    await expect(reader.getByText("解讀由 AI 產生")).toBeVisible();
  });

  await test.step("US-10 AC1 / US-09 AC1: tap a suggested follow-up", async () => {
    const chat = page.getByRole("region", { name: "追問解讀師" });
    await chat.getByRole("button", { name: "我該主動一點嗎？" }).click();
    await expect(chat.getByText("你問「我該主動一點嗎？」")).toBeVisible({
      timeout: 15_000,
    });
    await expect(chat.getByText("還可以追問 4 次")).toBeVisible();
  });

  await test.step("US-13 AC10 / US-14 AC4: the guest's reading is in this browser's history", async () => {
    await page.goto("/readings");
    await expect(
      page.getByText("紀錄只保存在這台裝置的瀏覽器中"),
    ).toBeVisible();
    await page.getByRole("button", { name: /今天我需要留意什麼？/ }).click();
    await expect(page.getByText("測試用的假解讀")).toBeVisible();
    await expect(page.getByText("你問「我該主動一點嗎？」")).toBeVisible();
  });
});
