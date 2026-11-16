"use client";

import { motion } from "framer-motion";
import { CardBack } from "@/components/card/card-back";
import type { FanOrigin } from "./card-fan";

export interface Flight {
  key: string;
  /** 目標牌陣位置索引 */
  slot: number;
  from: FanOrigin;
  /** 目標位置（viewport 座標） */
  to: { left: number; top: number; width: number };
}

/**
 * 從扇形飛到牌陣位置的牌（固定定位、蓋在畫面最上層）。
 * 以目標尺寸渲染，出發時用 scale 縮成扇形牌的大小，飛行途中略微上拋形成弧線。
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
