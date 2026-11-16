import { describe, expect, it } from "vitest";

import { cardName, drawCards, positionLabel } from "./cards";

describe("drawCards", () => {
  it("US-13 AC2: draws one card per spread position", () => {
    expect(drawCards("daily").map((c) => c.position)).toEqual(["today"]);
    expect(drawCards("three").map((c) => c.position)).toEqual([
      "past",
      "present",
      "future",
    ]);
    expect(drawCards("lenormand-nine")).toHaveLength(9);
  });

  it("US-13 AC2: never draws the same card twice in one reading", () => {
    for (let i = 0; i < 50; i++) {
      const ids = drawCards("lenormand-nine").map((c) => c.card_id);
      expect(new Set(ids).size).toBe(9);
    }
  });

  it("US-13 AC2: uses the random source for card and orientation", () => {
    const [card] = drawCards("daily", () => 0);
    expect(card).toEqual({
      position: "today",
      card_id: "fool",
      reversed: true,
    });
  });

  it("US-13 AC8: Lenormand cards are never reversed", () => {
    const cards = drawCards("lenormand-three", () => 0);
    expect(cards.map((c) => c.reversed)).toEqual([false, false, false]);
    expect(cards[0].card_id).toBe("rider");
  });
});

describe("names", () => {
  it("US-13 AC1: maps card and position ids to Traditional Chinese", () => {
    expect(cardName("world")).toBe("世界");
    expect(cardName("five-of-cups")).toBe("聖杯五");
    expect(cardName("rider")).toBe("騎士");
    expect(positionLabel("three", "past")).toBe("過去");
    expect(positionLabel("lenormand-nine", "center")).toBe("核心");
  });
});
