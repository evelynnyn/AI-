import { expect, test, type Page } from "@playwright/test";

import { drawCards } from "./reading";

// Each test names the acceptance criterion it checks (see the GitHub issues).

async function sidewaysOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
}

test("US-01 AC3: an unknown spread in the URL shows 404", async ({ page }) => {
  const response = await page.goto("/reading/no-such-spread");

  expect(response?.status()).toBe(404);
});

test("US-01 AC4: the home page fits a 320px phone without sideways scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");

  await expect(page.getByRole("link", { name: /九宮格/ })).toBeVisible();
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
});

test("US-16 AC4: with reduced motion the stars stop twinkling", async ({
  page,
}) => {
  const twinkle = () =>
    page
      .locator(".animate-twinkle")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);

  await page.goto("/");
  expect(await twinkle()).not.toBe("none");

  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await twinkle()).toBe("none");
});

test("US-17 AC3: a 320px phone shows all nine Lenormand cards without sideways scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/reading/lenormand-nine");
  await page.getByLabel("你想問什麼？").fill("接下來三個月的方向？");
  await drawCards(page, 9);

  const cards = page.getByRole("button", { name: /（正位）$/ });
  await expect(cards).toHaveCount(9);
  for (const box of await cards.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().toJSON()),
  )) {
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(320);
  }
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
});

test("US-17 AC1 / AC4: on a phone the three cards are at least 90px wide with names inside the card", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/reading/three");
  await page.getByLabel("你想問什麼？").fill("這個月的工作運勢如何？");
  await drawCards(page, 3);

  const widths = await page
    .getByRole("button", { name: /（[正逆]位）$/ })
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
  expect(widths).toHaveLength(3);
  widths.forEach((w) => expect(w).toBeGreaterThanOrEqual(90));
  const overflow = await page
    .getByRole("button", { name: /（[正逆]位）$/ })
    .evaluateAll((els) =>
      els.flatMap((card) => {
        const box = card.getBoundingClientRect();
        return [...card.querySelectorAll("[data-testid=card-face] span")]
          .filter((span) => span.textContent?.trim())
          .filter((span) => {
            const r = span.getBoundingClientRect();
            return (
              r.left < box.left - 1 ||
              r.right > box.right + 1 ||
              r.top < box.top - 1 ||
              r.bottom > box.bottom + 1
            );
          })
          .map((span) => span.textContent);
      }),
    );
  expect(overflow).toEqual([]);
});

test("US-04 AC4: the 轉動 buttons turn the fan", async ({ page }) => {
  await page.goto("/reading/three");
  await page.getByLabel("你想問什麼？").fill("這個月的工作運勢如何？");
  await page.getByRole("button", { name: "開始洗牌" }).click();
  await page.getByRole("button", { name: "停止洗牌" }).click();

  const first = page.getByRole("button", { name: "抽第 1 張牌" });
  const x = async () => (await first.boundingBox())!.x;
  const before = await x();

  await page.getByRole("button", { name: "向右轉動" }).click();
  await expect
    .poll(async () => Math.abs((await x()) - before))
    .toBeGreaterThan(20);
  const afterRight = await x();

  // Turning back the other way moves the card in the opposite direction.
  await page.getByRole("button", { name: "向左轉動" }).click();
  await expect
    .poll(async () => Math.sign((await x()) - afterRight))
    .toBe(-Math.sign(afterRight - before));
});
