import { describe, expect, it } from "vitest";

import { cardName, drawCards, MAJOR_ARCANA } from "./cards";

describe("drawCards", () => {
  it("US-13 AC2: draws one card per spread position", () => {
    expect(drawCards("daily").map((c) => c.position)).toEqual(["今日"]);
    expect(drawCards("three_card").map((c) => c.position)).toEqual([
      "過去",
      "現在",
      "未來",
    ]);
  });

  it("US-13 AC2: never draws the same card twice in one reading", () => {
    for (let i = 0; i < 50; i++) {
      const ids = drawCards("three_card").map((c) => c.card_id);
      expect(new Set(ids).size).toBe(3);
    }
  });

  it("US-13 AC2: uses the random source for card and orientation", () => {
    const [card] = drawCards("daily", () => 0);
    expect(card).toEqual({
      position: "今日",
      card_id: "major-00",
      reversed: true,
    });
  });
});

describe("cardName", () => {
  it("US-13 AC1: maps ids to Traditional Chinese names", () => {
    expect(cardName("major-21")).toBe("世界");
    expect(MAJOR_ARCANA).toHaveLength(22);
  });
});
