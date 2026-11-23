"use client";

import type { RefObject } from "react";
import { FlipCard } from "@/components/card/flip-card";
import type { BaseCard, CardFaceInfo } from "@/lib/tarot/decks";
import type { SpreadPosition } from "@/lib/tarot/spreads";

export interface SlotCard {
  card: BaseCard;
  face: CardFaceInfo;
  reversed: boolean;
}

interface SpreadBoardProps {
  positions: SpreadPosition[];
  /** Number of columns */
  columns?: number;
  /** Card at each position (null until drawn) */
  cards: (SlotCard | null)[];
  /** Whether each card has landed */
  placed: boolean[];
  flipped: boolean[];
  /** Whether cards can be flipped */
  canFlip: boolean;
  onFlip: (slot: number) => void;
  /** Whether the deck uses reversals (hides 正位／逆位 when not) */
  deckHasReversed: boolean;
  /** Reports each position's coordinates to the parent as flight targets */
  slotRefs: RefObject<(HTMLDivElement | null)[]>;
}

/** The spread laid out by position; empty positions show a dashed outline (US-05) */
export function SpreadBoard({
  positions,
  columns,
  cards,
  placed,
  flipped,
  canFlip,
  onFlip,
  deckHasReversed,
  slotRefs,
}: SpreadBoardProps) {
  const cols = columns ?? positions.length;
  const rows = Math.ceil(positions.length / cols);
  // One card is larger; a row of three scales with phone width; several rows shrink so the spread fits the screen
  const slotWidth =
    positions.length === 1
      ? "w-36 sm:w-44"
      : rows === 1
        ? "w-[27vw] max-w-40 sm:w-40"
        : "w-[19vw] max-w-24 sm:w-28";
  // Matches the widths above so only the needed image size downloads
  const imageSizes =
    positions.length === 1
      ? "(max-width: 640px) 144px, 176px"
      : rows === 1
        ? "(max-width: 640px) 27vw, 160px"
        : "(max-width: 640px) 19vw, 112px";

  return (
    <div
      className="grid items-start justify-center gap-x-3 gap-y-3 sm:gap-x-8 sm:gap-y-5"
      style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}
    >
      {positions.map((pos, i) => {
        const slot = cards[i];
        return (
          <div key={pos.id} className="flex flex-col items-center gap-2">
            <div
              ref={(el) => {
                slotRefs.current[i] = el;
              }}
              className={`relative aspect-[7/12] ${slotWidth}`}
            >
              {/* Empty position outline */}
              <div className="absolute inset-0 flex items-center justify-center rounded-[8%/4.7%] border border-dashed border-champagne-soft bg-abyss/40">
                <span className="font-display text-3xl text-champagne-soft">
                  {i + 1}
                </span>
              </div>
              {slot && placed[i] && (
                <FlipCard
                  card={slot.card}
                  face={slot.face}
                  reversed={slot.reversed}
                  flipped={flipped[i]}
                  onFlip={canFlip ? () => onFlip(i) : undefined}
                  className="absolute inset-0 w-full"
                  sizes={imageSizes}
                />
              )}
            </div>
            <div className="text-center">
              <p
                className={`font-serif-tc tracking-[0.1em] text-champagne ${rows > 1 ? "text-xs" : "text-sm"}`}
              >
                {pos.label}
              </p>
              {slot && flipped[i] && deckHasReversed && (
                <p
                  className={`mt-0.5 inline-block rounded-full px-2 text-xs ${slot.reversed ? "bg-wine-bright text-cream" : "text-muted-foreground"}`}
                >
                  {slot.reversed ? "逆位" : "正位"}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
