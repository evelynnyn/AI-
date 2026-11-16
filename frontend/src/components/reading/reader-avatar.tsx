"use client";

import { useState } from "react";

import type { Reader } from "@/lib/tarot/readers";
import { cn } from "@/lib/utils";

/** Reader avatar from public/readers/; a gold line placeholder when the image is missing (US-07 AC4). */
export function ReaderAvatar({
  reader,
  className = "size-14",
}: {
  reader: Reader;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={cn(
        "ring-champagne relative inline-flex shrink-0 overflow-hidden rounded-full ring-1",
        className,
      )}
    >
      {failed ? (
        <Placeholder glyph={reader.placeholderGlyph} />
      ) : (
        // A plain img, so a 404 can switch to the placeholder.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={reader.avatar}
          alt={reader.name}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          ref={(el) => {
            // The image may fail before React attaches onError.
            if (el && el.complete && el.naturalWidth === 0) setFailed(true);
          }}
        />
      )}
    </span>
  );
}

function Placeholder({ glyph }: { glyph: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden
      data-testid="avatar-placeholder"
      className="bg-wine text-champagne h-full w-full"
    >
      <g className="fill-none stroke-current">
        <circle cx="32" cy="32" r="27" strokeWidth="0.8" />
        <circle cx="32" cy="32" r="22" strokeWidth="0.5" opacity="0.6" />
        <path
          d="M32 2v5M32 57v5M2 32h5M57 32h5M10.8 10.8l3.5 3.5M49.7 49.7l3.5 3.5M10.8 53.2l3.5-3.5M49.7 14.3l3.5-3.5"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </g>
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="22"
        className="fill-current"
      >
        {glyph + "︎"}
      </text>
    </svg>
  );
}
