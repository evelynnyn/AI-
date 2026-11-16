import lenormandCards from "@/data/catalog/lenormand_cards.json";
import spreadList from "@/data/catalog/spreads.json";
import tarotCards from "@/data/catalog/tarot_cards.json";
import type { DrawnCard, Reading } from "@/lib/api/client";

// Copies of backend/app/catalog; catalog.test.ts fails if they drift apart.

export type Spread = Reading["spread"];
export type Reader = Reading["reader"];
export type DeckId = "tarot" | "lenormand";

interface SpreadInfo {
  label: string;
  deckId: DeckId;
  positions: { id: string; label: string }[];
}

export const SPREADS = Object.fromEntries(
  spreadList.map((s) => [
    s.id,
    {
      label: s.nameZh,
      deckId: s.deckId as DeckId,
      positions: s.positions.map(({ id, label }) => ({ id, label })),
    },
  ]),
) as Record<Spread, SpreadInfo>;

export const READERS: Record<Reader, string> = {
  "high-priestess": "女祭司",
  magician: "魔術師",
  fool: "愚者",
};

const DECKS: Record<DeckId, { ids: string[]; supportsReversed: boolean }> = {
  tarot: { ids: tarotCards.map((c) => c.id), supportsReversed: true },
  lenormand: { ids: lenormandCards.map((c) => c.id), supportsReversed: false },
};

const CARD_NAMES = new Map(
  [...tarotCards, ...lenormandCards].map((c) => [c.id, c.nameZh]),
);

export function cardName(cardId: string): string {
  return CARD_NAMES.get(cardId) ?? cardId;
}

export function positionLabel(spread: Spread, positionId: string): string {
  return (
    SPREADS[spread].positions.find((p) => p.id === positionId)?.label ??
    positionId
  );
}

/** Draw distinct cards for a spread. Temporary until the shuffle UI (US-03, US-04) exists. */
export function drawCards(
  spread: Spread,
  random: () => number = Math.random,
): DrawnCard[] {
  const { deckId, positions } = SPREADS[spread];
  const deck = DECKS[deckId];
  const remaining = [...deck.ids];
  return positions.map((position) => {
    const [cardId] = remaining.splice(
      Math.floor(random() * remaining.length),
      1,
    );
    return {
      position: position.id,
      card_id: cardId,
      reversed: deck.supportsReversed && random() < 0.5,
    };
  });
}
