import type { BaseCard, Orientation } from "./decks";

/** One card in the shuffled pile: which card and which way up. */
export interface PileCard {
  cardId: string;
  orientation: Orientation;
}

export type RandomInt = (max: number) => number;

/** Uniform integer in [0, max) from crypto, with rejection sampling to avoid modulo bias. */
export const cryptoRandomInt: RandomInt = (max) => {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
};

/** Fisher-Yates shuffle; returns a new array. */
export function fisherYates<T>(
  items: readonly T[],
  randomInt: RandomInt = cryptoRandomInt,
): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Shuffle the whole deck and pick each card's orientation (all upright when the deck has none). */
export function shuffleDeck(
  cards: readonly BaseCard[],
  allowReversed: boolean,
  randomInt: RandomInt = cryptoRandomInt,
): PileCard[] {
  return fisherYates(cards, randomInt).map((card) => ({
    cardId: card.id,
    orientation: allowReversed && randomInt(2) === 1 ? "reversed" : "upright",
  }));
}
