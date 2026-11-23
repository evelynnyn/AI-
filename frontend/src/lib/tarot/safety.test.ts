import { describe, expect, it } from "vitest";

import { stripMarkdown, telHref } from "./safety";

describe("stripMarkdown", () => {
  it("US-11 AC4: bold markers and headings the AI still writes are removed", () => {
    expect(stripMarkdown("## 今天的牌\n**太陽**代表希望。\n# 建議")).toBe(
      "今天的牌\n太陽代表希望。\n建議",
    );
  });

  it("US-11 AC4: ordinary text, numbers and # inside a sentence stay as they are", () => {
    expect(stripMarkdown("第 #1 個建議：每天走 3 分鐘。")).toBe(
      "第 #1 個建議：每天走 3 分鐘。",
    );
  });
});

describe("telHref", () => {
  it("SEC-01 AC4: 119／110 dials the first number", () => {
    expect(telHref("119／110")).toBe("tel:119");
    expect(telHref("1925")).toBe("tel:1925");
  });
});
