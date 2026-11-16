import { expect, type Page } from "@playwright/test";

/** Shuffle, pick `count` cards from the fan and turn them all over. */
export async function drawCards(page: Page, count: number) {
  await page.getByRole("button", { name: "開始洗牌" }).click();
  await page.getByRole("button", { name: "停止洗牌" }).click();

  for (let i = 1; i <= count; i++) {
    // Fan cards overlap, so dispatch the click instead of aiming the pointer.
    await page
      .getByRole("button", { name: `抽第 ${i} 張牌` })
      .dispatchEvent("click");
  }

  if (count > 1) {
    await page.getByRole("button", { name: "全部翻開" }).click();
  } else {
    await page.getByRole("button", { name: "翻開這張牌" }).click();
  }
  await expect(page.getByText("牌已全部翻開")).toBeVisible();
}
