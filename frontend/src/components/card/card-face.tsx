import Image from "next/image";

import type { BaseCard, CardFaceInfo } from "@/lib/tarot/decks";
import { cn } from "@/lib/utils";

interface CardFaceProps {
  card: BaseCard;
  face: CardFaceInfo;
  /** Reversed cards turn the whole face 180 degrees (US-05). */
  reversed?: boolean;
  className?: string;
  /** next/image sizes: the shown width, so the browser downloads a fitting image (US-18). */
  sizes?: string;
}

/**
 * Card face (US-16, US-20). With an illustration: art in the middle, a champagne SVG
 * frame and the Chinese name below. Without one: a text card with number, symbol and
 * names. Text uses cqw units so the layout scales with the card.
 */
export function CardFace({
  card,
  face,
  reversed = false,
  className,
  sizes = "(max-width: 640px) 30vw, 160px",
}: CardFaceProps) {
  return (
    <div
      data-testid="card-face"
      className={cn(
        "@container bg-abyss relative aspect-[7/12] overflow-hidden rounded-[8%/4.7%] shadow-lg shadow-black/50",
        className,
      )}
    >
      <div className={cn("absolute inset-0", reversed && "rotate-180")}>
        {card.image ? (
          <IllustratedFace card={card} src={card.image} sizes={sizes} />
        ) : (
          <TextFace card={card} face={face} />
        )}
      </div>
    </div>
  );
}

/* Art window x 4.2–65.8, y 4.2–96.6 of 70×120 (exactly 2:3); the frame below uses the same numbers. */
const ART = { left: "6%", top: "3.5%", width: "88%", height: "77%" };

function IllustratedFace({
  card,
  src,
  sizes,
}: {
  card: BaseCard;
  src: string;
  sizes: string;
}) {
  return (
    <div className="from-surface to-abyss absolute inset-0 bg-linear-to-b">
      <div className="bg-surface absolute overflow-hidden" style={ART}>
        <Image
          src={src}
          alt={card.nameZh}
          fill
          sizes={sizes}
          className="object-cover"
        />
      </div>
      <CardFrame />
      <div className="absolute inset-x-[10%] top-[81%] bottom-[3%] flex items-center justify-center">
        <span className="font-serif-tc text-cream text-[11.5cqw] leading-none font-bold tracking-[0.12em] whitespace-nowrap">
          {card.nameZh}
        </span>
      </div>
    </div>
  );
}

const sparkle = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r}L${cx + r * 0.25} ${cy - r * 0.25}L${cx + r} ${cy}L${cx + r * 0.25} ${cy + r * 0.25}L${cx} ${cy + r}L${cx - r * 0.25} ${cy + r * 0.25}L${cx - r} ${cy}L${cx - r * 0.25} ${cy - r * 0.25}Z`;
const diamond = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`;

/** Champagne line frame: double outer border, art window, corner diamonds, name sparkles. */
function CardFrame() {
  return (
    <svg
      viewBox="0 0 70 120"
      preserveAspectRatio="none"
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <g className="stroke-champagne fill-none">
        <rect
          x="1.3"
          y="1.3"
          width="67.4"
          height="117.4"
          rx="4.4"
          strokeWidth="0.6"
        />
        <rect
          x="2.7"
          y="2.7"
          width="64.6"
          height="114.6"
          rx="3.2"
          strokeWidth="0.3"
          opacity="0.55"
        />
        <rect x="4.2" y="4.2" width="61.6" height="92.4" strokeWidth="0.55" />
        <rect
          x="5.1"
          y="5.1"
          width="59.8"
          height="90.6"
          strokeWidth="0.25"
          opacity="0.6"
        />
      </g>
      <g className="fill-champagne stroke-abyss" strokeWidth="0.3">
        <path
          d={[
            diamond(4.2, 4.2, 1.5),
            diamond(65.8, 4.2, 1.5),
            diamond(4.2, 96.6, 1.5),
            diamond(65.8, 96.6, 1.5),
            diamond(35, 4.2, 1.1),
          ].join("")}
        />
      </g>
      <g className="fill-champagne">
        <path d={sparkle(9.5, 107, 1.8) + sparkle(60.5, 107, 1.8)} />
      </g>
    </svg>
  );
}

/** Text card for cards without art: cream paper with wine and dark ink (US-20). */
function TextFace({ card, face }: { card: BaseCard; face: CardFaceInfo }) {
  return (
    <div className="bg-cream absolute inset-0 p-[4cqw]">
      <div className="border-wine outline-champagne flex h-full flex-col items-center justify-between rounded-[4cqw] border px-[5cqw] py-[7cqw] text-center outline outline-1 outline-offset-[1.5cqw]">
        <span className="font-display text-wine text-[14cqw] leading-none font-semibold">
          {face.label}
        </span>
        <span
          className={cn(
            "flex flex-1 items-center justify-center",
            face.accentClass,
          )}
        >
          {face.iconPaths ? (
            <svg
              viewBox="0 0 24 24"
              className="size-[42cqw]"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {face.iconPaths.map((d) => (
                <path key={d} d={d} />
              ))}
            </svg>
          ) : (
            <span className="text-[40cqw] leading-none">{face.symbol}</span>
          )}
        </span>
        <span>
          <span className="font-serif-tc text-abyss block text-[13cqw] leading-tight font-bold">
            {card.nameZh}
          </span>
          <span className="font-display text-wine mt-[1cqw] block text-[8.5cqw] leading-tight italic">
            {card.nameEn}
          </span>
        </span>
      </div>
    </div>
  );
}
