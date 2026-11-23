"use client";

import { animate, motion, useMotionValue } from "framer-motion";
import { CardBack } from "@/components/card/card-back";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";

/** Where the picked card is on screen, so the flight animation starts there */
export interface FanOrigin {
  /** Card center (viewport coordinates) */
  cx: number;
  cy: number;
  /** Card width before rotation */
  width: number;
  /** Card's current rotation */
  rotate: number;
}

interface CardFanProps {
  /** Number of cards in the pile */
  count: number;
  /** Indexes already drawn */
  picked: ReadonlySet<number>;
  /** Whether more cards can be drawn */
  disabled: boolean;
  onPick: (index: number, origin: FanOrigin) => void;
}

const CARD_RATIO = 12 / 7;

/**
 * Step 3: pick cards from a fan (US-04).
 * All cards lie face down on a large circle centered below the screen, so only the top arc shows.
 * Drag sideways to turn the fan, tap to draw. Each card stays wide enough to tap on phones.
 */
export function CardFan({ count, picked, disabled, onPick }: CardFanProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const rotation = useMotionValue(0);
  const centered = useRef(false);
  const drag = useRef({
    active: false,
    startX: 0,
    startRot: 0,
    moved: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
  });
  const suppressClick = useRef(false);

  // Watch the container width to size the fan radius and the cards
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isMobile = width < 640;
  const cardW = isMobile ? 54 : 70;
  const cardH = cardW * CARD_RATIO;
  const radius = Math.min(Math.max(width * 0.95, 300), 680);
  // Enough cards (78 tarot) fill the whole circle; fewer (36 Lenormand) use a fixed-spacing fan so gaps stay small
  const maxStep = ((cardW * 0.62) / radius) * (180 / Math.PI);
  const step = Math.min(360 / count, maxStep);
  const fullCircle = step * count >= 359.9;
  /** For a partial fan, limit turning so the first and last cards stop at the center */
  const clampRot = useCallback(
    (r: number) =>
      fullCircle ? r : Math.min(0, Math.max(-(count - 1) * step, r)),
    [fullCircle, count, step],
  );
  // Show only about ±26° at the top of the circle; this sets the container height (desktop never shows half a circle)
  const halfAngle = Math.min(
    Math.asin(Math.min(1, width / 2 / radius)),
    (26 * Math.PI) / 180,
  );
  const height = cardH + radius * (1 - Math.cos(halfAngle)) + 40;
  const centerY = 26 + cardH / 2 + radius;
  /** Degrees turned per dragged pixel, so cards follow the finger */
  const degPerPx = 180 / (Math.PI * radius);

  // Once measured, center a partial fan
  useEffect(() => {
    if (!width || centered.current) return;
    centered.current = true;
    if (!fullCircle) rotation.set(-((count - 1) * step) / 2);
  }, [width, fullCircle, count, step, rotation]);

  // ---- Drag to turn ----
  const onPointerDown = (e: PointerEvent) => {
    drag.current = {
      active: true,
      startX: e.clientX,
      startRot: rotation.get(),
      moved: 0,
      lastX: e.clientX,
      lastT: performance.now(),
      velocity: 0,
    };
    rotation.stop();
  };

  useEffect(() => {
    const move = (e: globalThis.PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      const dx = e.clientX - d.startX;
      d.moved = Math.max(d.moved, Math.abs(dx));
      rotation.set(clampRot(d.startRot + dx * degPerPx));
      const now = performance.now();
      const dt = now - d.lastT;
      if (dt > 0) d.velocity = ((e.clientX - d.lastX) / dt) * 1000 * degPerPx; // degrees per second
      d.lastX = e.clientX;
      d.lastT = now;
    };
    const up = () => {
      const d = drag.current;
      if (!d.active) return;
      d.active = false;
      if (d.moved > 6) {
        // A drag is not a tap
        suppressClick.current = true;
        setTimeout(() => (suppressClick.current = false), 0);
        // Coast after release
        animate(rotation, clampRot(rotation.get() + d.velocity * 0.35), {
          duration: 0.8,
          ease: [0.2, 0.7, 0.3, 1],
        });
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [degPerPx, rotation, clampRot]);

  /** Turn by n cards with the buttons */
  const spin = (cards: number) => {
    animate(rotation, clampRot(rotation.get() + cards * step), {
      duration: 0.5,
      ease: "easeOut",
    });
  };

  const handleClick = (i: number, e: MouseEvent<HTMLButtonElement>) => {
    if (suppressClick.current || disabled || picked.has(i)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onPick(i, {
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      width: cardW,
      rotate: i * step + rotation.get(),
    });
  };

  return (
    <div className="flex flex-col items-center">
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        className="fan-mask relative w-full touch-pan-y overflow-hidden select-none"
        style={{ height: width ? height : 220, cursor: "grab" }}
      >
        {width > 0 && (
          // Turntable: a 0×0 point at the circle's center; rotating it turns every card
          <motion.div
            className="absolute h-0 w-0"
            style={{ left: width / 2, top: centerY, rotate: rotation }}
          >
            {Array.from({ length: count }, (_, i) => {
              const gone = picked.has(i);
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`抽第 ${i + 1} 張牌`}
                  tabIndex={gone ? -1 : 0}
                  onClick={(e) => handleClick(i, e)}
                  className="group absolute focus:outline-none"
                  style={{
                    width: cardW,
                    height: cardH,
                    left: -cardW / 2,
                    top: -cardH / 2,
                    transform: `rotate(${i * step}deg) translateY(${-radius}px)`,
                    opacity: gone ? 0 : 1,
                    pointerEvents: gone ? "none" : undefined,
                    transition: "opacity .25s",
                  }}
                >
                  <CardBack className="h-full w-full transition-transform duration-200 group-hover:-translate-y-3 group-focus-visible:-translate-y-3 group-focus-visible:ring-2 group-focus-visible:ring-champagne" />
                </button>
              );
            })}
          </motion.div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-6 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={() => spin(6)}
          className="rounded-full px-3 py-1 hover:text-champagne"
          aria-label="向左轉動"
        >
          ‹ 轉動
        </button>
        <span className="text-xs">左右滑動牌扇</span>
        <button
          type="button"
          onClick={() => spin(-6)}
          className="rounded-full px-3 py-1 hover:text-champagne"
          aria-label="向右轉動"
        >
          轉動 ›
        </button>
      </div>
    </div>
  );
}
