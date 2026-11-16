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
  /** 排成幾欄 */
  columns?: number;
  /** 每個位置的牌（尚未抽到為 null） */
  cards: (SlotCard | null)[];
  /** 牌是否已飛抵位置 */
  placed: boolean[];
  flipped: boolean[];
  /** 是否開放翻牌 */
  canFlip: boolean;
  onFlip: (slot: number) => void;
  /** 牌系是否有正逆位（沒有就不顯示「正位／逆位」） */
  deckHasReversed: boolean;
  /** 讓父層取得每個位置的座標，作為飛行目標 */
  slotRefs: RefObject<(HTMLDivElement | null)[]>;
}

/** 牌陣：依位置排列，未抽到的位置顯示虛線框 */
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
  // 單張牌大一點；一列三張依手機寬度縮放；多列時縮小，避免整個牌陣超出畫面
  const slotWidth =
    positions.length === 1
      ? "w-36 sm:w-44"
      : rows === 1
        ? "w-[27vw] max-w-40 sm:w-40"
        : "w-[19vw] max-w-24 sm:w-28";
  // 與上面的寬度對應，讓插畫只下載需要的尺寸
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
              {/* 空位虛線框 */}
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
