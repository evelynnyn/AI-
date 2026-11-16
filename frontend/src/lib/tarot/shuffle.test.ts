import { describe, expect, it } from "vitest";

import { lenormandDeck, tarotDeck } from "./decks";
import { fisherYates, shuffleDeck } from "./shuffle";

describe("shuffleDeck", () => {
  it("US-04 AC1: the fan holds every card of the deck exactly once", () => {
    const pile = shuffleDeck(tarotDeck.cards, true);

    expect(pile).toHaveLength(78);
    expect(new Set(pile.map((c) => c.cardId))).toEqual(
      new Set(tarotDeck.cards.map((c) => c.id)),
    );
  });

  it("US-05 AC2: tarot cards can come out reversed", () => {
    const alwaysOne = () => 1;
    const pile = shuffleDeck(tarotDeck.cards, true, alwaysOne);

    expect(pile.every((c) => c.orientation === "reversed")).toBe(true);
  });

  it("US-13 AC8: Lenormand cards are always upright", () => {
    const pile = shuffleDeck(lenormandDeck.cards, false, () => 1);

    expect(pile).toHaveLength(36);
    expect(pile.every((c) => c.orientation === "upright")).toBe(true);
  });

  it("US-04 AC1: Fisher-Yates follows the random source and keeps the input", () => {
    const input = ["a", "b", "c", "d"];

    expect(fisherYates(input, () => 0)).toEqual(["b", "c", "d", "a"]);
    expect(input).toEqual(["a", "b", "c", "d"]);
  });
});
