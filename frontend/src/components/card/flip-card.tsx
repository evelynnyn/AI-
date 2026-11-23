"use client";

import { motion } from "framer-motion";

import type { BaseCard, CardFaceInfo } from "@/lib/tarot/decks";
import { cn } from "@/lib/utils";

import { CardBack } from "./card-back";
import { CardFace } from "./card-face";

interface FlipCardProps {
  card: BaseCard;
  face: CardFaceInfo;
  reversed: boolean;
  flipped: boolean;
  /** Not clickable when omitted. */
  onFlip?: () => void;
  className?: string;
  sizes?: string;
}

/** A face-down card that turns over with a 3D rotateY when tapped (US-05). */
export function FlipCard({
  card,
  face,
  reversed,
  flipped,
  onFlip,
  className,
  sizes,
}: FlipCardProps) {
  const clickable = !!onFlip && !flipped;
  return (
    <motion.button
      type="button"
      onClick={clickable ? onFlip : undefined}
      disabled={!clickable}
      aria-label={
        flipped
          ? `${card.nameZh}${reversed ? "（逆位）" : "（正位）"}`
          : "翻開這張牌"
      }
      className={cn(
        "relative block aspect-[7/12] [perspective:1000px] disabled:cursor-default",
        clickable && "cursor-pointer",
        className,
      )}
      whileHover={clickable ? { y: -6 } : undefined}
      whileTap={clickable ? { scale: 0.97 } : undefined}
    >
      <motion.div
        className="preserve-3d absolute inset-0"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: [0.3, 0.1, 0.2, 1] }}
      >
        <div className="backface-hidden absolute inset-0">
          <CardBack className="h-full w-full" />
          {clickable && (
            <span className="ring-champagne/70 absolute inset-0 animate-pulse rounded-[8%/4.7%] ring-1" />
          )}
        </div>
        <div className="backface-hidden absolute inset-0 [transform:rotateY(180deg)]">
          <CardFace
            card={card}
            face={face}
            reversed={reversed}
            className="h-full w-full"
            sizes={sizes}
          />
        </div>
      </motion.div>
    </motion.button>
  );
}
