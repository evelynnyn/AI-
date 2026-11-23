"use client";

import { motion } from "framer-motion";
import { CardBack } from "@/components/card/card-back";
import type { FanOrigin } from "./card-fan";

export interface Flight {
  key: string;
  /** Index of the target spread position */
  slot: number;
  from: FanOrigin;
  /** Target position (viewport coordinates) */
  to: { left: number; top: number; width: number };
}

/**
 * A card flying from the fan to its spread position (fixed, above everything else).
 * Rendered at the target size and scaled down to the fan card's size at the start; it rises slightly mid-flight to make an arc.
 */
export function FlyingCard({
  flight,
  onLanded,
}: {
  flight: Flight;
  onLanded: () => void;
}) {
  const { from, to } = flight;
  const toH = (to.width * 12) / 7;
  const startX = from.cx - to.width / 2;
  const startY = from.cy - toH / 2;
  const peakY = Math.min(startY, to.top) - 60;

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-50"
      style={{ width: to.width }}
      initial={{
        x: startX,
        y: startY,
        rotate: from.rotate,
        scale: from.width / to.width,
      }}
      animate={{
        x: to.left,
        y: [startY, peakY, to.top],
        rotate: 0,
        scale: [from.width / to.width, 1.15, 1],
      }}
      transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={onLanded}
    >
      <CardBack className="w-full" />
    </motion.div>
  );
}
