"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { CardBack } from "@/components/card/card-back";
import { PillButton } from "@/components/common/pill-button";

/** Cards in the visual pile (not the real deck size). */
const STACK = 12;

/** Fixed direction and reach per card, so renders do not jump. */
const MOTION = Array.from({ length: STACK }, (_, i) => ({
  side: i % 2 === 0 ? -1 : 1,
  reach: 0.6 + ((i * 37) % 10) / 20,
}));

/** Step 2: the pile shuffles until the user taps 停止洗牌 (US-03). */
export function ShuffleStep({ onDone }: { onDone: () => void }) {
  const [shuffling, setShuffling] = useState(true);

  const stop = () => {
    setShuffling(false);
    setTimeout(onDone, 700); // let the cards gather first
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center pt-8 text-center"
    >
      <h1 className="font-serif-tc text-cream title-glow text-3xl font-bold tracking-[0.12em]">
        洗牌中
      </h1>
      <p className="text-muted-foreground mt-3 text-sm">
        專注想著你的問題，覺得可以了，就停止洗牌。
      </p>

      <div className="relative mt-14 mb-12 h-56 w-32 sm:h-64 sm:w-36">
        {MOTION.map(({ side, reach }, i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{ zIndex: i }}
            initial={{ x: 0, y: -i * 1.5, rotate: 0 }}
            animate={
              shuffling
                ? {
                    x: [0, side * 90 * reach, side * 20, 0],
                    y: [-i * 1.5, -10 * reach, -i * 1.5, -i * 1.5],
                    rotate: [0, side * 14 * reach, side * 3, 0],
                  }
                : { x: 0, y: -i * 1.5, rotate: 0 }
            }
            transition={
              shuffling
                ? {
                    duration: 1.1,
                    repeat: Infinity,
                    delay: i * 0.06,
                    ease: "easeInOut",
                  }
                : { duration: 0.5, ease: "easeOut" }
            }
          >
            <CardBack className="h-full w-full" />
          </motion.div>
        ))}
      </div>

      <PillButton onClick={stop} disabled={!shuffling}>
        {shuffling ? "停止洗牌" : "洗牌完成"}
      </PillButton>
    </motion.section>
  );
}
