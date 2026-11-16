import spreadList from "@/data/catalog/spreads.json";
import type { Reading } from "@/lib/api/client";

import type { DeckId } from "./decks";

export type SpreadId = Reading["spread"];

export interface SpreadPosition {
  id: string;
  label: string;
  meaning: string;
}

export interface Spread {
  id: SpreadId;
  deckId: DeckId;
  nameZh: string;
  nameEn: string;
  description: string;
  icon: string;
  positions: SpreadPosition[];
  /** Number of columns; all cards sit in one row when omitted. */
  columns?: number;
  /** Example questions users can tap to fill in (US-02). */
  examples: string[];
  defaultQuestion: string;
}

export const SPREAD_LIST = spreadList as Spread[];

export const SPREADS = Object.fromEntries(
  SPREAD_LIST.map((s) => [s.id, s]),
) as Record<SpreadId, Spread>;

export function isSpreadId(id: string): id is SpreadId {
  return id in SPREADS;
}

export function positionLabel(spread: SpreadId, positionId: string): string {
  return (
    SPREADS[spread].positions.find((p) => p.id === positionId)?.label ??
    positionId
  );
}
