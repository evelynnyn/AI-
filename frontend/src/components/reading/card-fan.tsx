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

/** 被點選的牌在畫面上的位置，用來讓飛行動畫從這裡出發 */
export interface FanOrigin {
  /** 牌中心點（viewport 座標） */
  cx: number;
  cy: number;
  /** 牌未旋轉時的寬度 */
  width: number;
  /** 牌目前的旋轉角度 */
  rotate: number;
}

interface CardFanProps {
  /** 牌堆張數 */
  count: number;
  /** 已被抽走的索引 */
  picked: ReadonlySet<number>;
  /** 是否還能再抽 */
  disabled: boolean;
  onPick: (index: number, origin: FanOrigin) => void;
}

const CARD_RATIO = 12 / 7;

/**
 * 步驟三：扇形選牌。
 * 所有牌背朝上排在一個大圓周上（圓心在畫面下方），只露出上緣的扇形。
 * 左右拖曳可轉動扇面，點一下抽牌。手機上每張牌也有足夠的點擊寬度。
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

  // 監聽容器寬度，決定扇形半徑與牌的大小
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
  // 牌夠多（塔羅 78 張）就排滿一整圈；牌少（雷諾曼 36 張）時改成固定間距的扇形，避免牌之間空太開
  const maxStep = ((cardW * 0.62) / radius) * (180 / Math.PI);
  const step = Math.min(360 / count, maxStep);
  const fullCircle = step * count >= 359.9;
  /** 扇形未滿一圈時，限制可轉動的範圍（讓第一張與最後一張最多轉到正中央） */
  const clampRot = useCallback(
    (r: number) =>
      fullCircle ? r : Math.min(0, Math.max(-(count - 1) * step, r)),
    [fullCircle, count, step],
  );
  // 只露出圓周頂端約 ±26° 的扇形，決定容器高度（桌機版不會露出半個圓）
  const halfAngle = Math.min(
    Math.asin(Math.min(1, width / 2 / radius)),
    (26 * Math.PI) / 180,
  );
  const height = cardH + radius * (1 - Math.cos(halfAngle)) + 40;
  const centerY = 26 + cardH / 2 + radius;
  /** 每拖曳 1px 轉動的角度：讓牌跟著手指移動 */
  const degPerPx = 180 / (Math.PI * radius);

  // 量到寬度後，未滿一圈的扇形先轉到正中間
  useEffect(() => {
    if (!width || centered.current) return;
    centered.current = true;
    if (!fullCircle) rotation.set(-((count - 1) * step) / 2);
  }, [width, fullCircle, count, step, rotation]);

  // ---- 拖曳轉動 ----
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
      if (dt > 0) d.velocity = ((e.clientX - d.lastX) / dt) * 1000 * degPerPx; // 度/秒
      d.lastX = e.clientX;
      d.lastT = now;
    };
    const up = () => {
      const d = drag.current;
      if (!d.active) return;
      d.active = false;
      if (d.moved > 6) {
        // 有拖曳就不算點擊
        suppressClick.current = true;
        setTimeout(() => (suppressClick.current = false), 0);
        // 放手後慣性滑行
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

  /** 用按鈕轉動 n 張牌的距離 */
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
        className="relative w-full touch-pan-y overflow-hidden select-none"
        style={{
          height: width ? height : 220,
          cursor: "grab",
          // 下緣與左右兩側淡出，讓扇形看起來自然收尾
          maskImage:
            "linear-gradient(to bottom, #000 70%, transparent), linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      >
        {width > 0 && (
          // 轉盤：一個 0×0 的點放在圓心，旋轉它就能轉動整圈牌
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
