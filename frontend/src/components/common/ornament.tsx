import { cn } from "@/lib/utils";

/** Candle above the home title; the flame flickers. */
export function CandleOrnament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 72"
      aria-hidden
      className={cn("text-champagne", className)}
    >
      <circle
        cx="24"
        cy="16"
        r="14"
        className="fill-champagne"
        opacity="0.08"
      />
      <g className="animate-flicker origin-[24px_24px]">
        <path
          d="M24 6c3.5 5 5 8.5 5 11.5a5 5 0 0 1-10 0c0-3 1.5-6.5 5-11.5Z"
          className="fill-champagne"
          opacity="0.9"
        />
        <path
          d="M24 13c1.4 2.2 2 3.6 2 4.8a2 2 0 0 1-4 0c0-1.2.6-2.6 2-4.8Z"
          className="fill-cream"
        />
      </g>
      <g
        className="fill-none stroke-current"
        strokeWidth="1"
        strokeLinecap="round"
      >
        <path d="M24 22.5v3" />
        <rect x="18" y="25.5" width="12" height="30" rx="1.5" />
        <path d="M21 30v8" opacity="0.5" />
        <path d="M12 58h24M15 58c0 4 4 6 9 6s9-2 9-6M20 64v4M28 64v4M16 69h16" />
      </g>
    </svg>
  );
}

/** Rose corner for the top-left of a panel; rotate or flip it for other corners. */
export function RoseCorner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden
      className={cn("pointer-events-none text-champagne", className)}
    >
      <g
        className="fill-none stroke-current"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 12c2.5-2.5 6.5-2 7.5 1s-1.5 6-4.5 5.5-4.5-3-3-6.5Z" />
        <path d="M11 13c-1-4 3-8 8-7.5 4.5.5 7 4 6 8" />
        <path d="M10 14c-1 4.5 2 8.5 7 8.5s8-3.5 8-7.5" />
        <path d="M25 16c8-1 16 0 26 4M18 23c1 8 0 16-3 25" opacity="0.8" />
        <path d="M36 17.5c3-3.5 7-4 9-3-1.5 3-5 4.5-9 3Z" />
        <path d="M17 36c-3.5-2.5-4.5-6.5-3.5-9 3 1 4.5 5 3.5 9Z" />
        <path d="M51 20c1.5-1.8 3.5-1.8 4.2-.3s-.6 3.2-2.6 3.2-2.4-1.4-1.6-2.9ZM15 48c-1.8 1.5-1.8 3.5-.3 4.2s3.2-.6 3.2-2.6-1.4-2.4-2.9-1.6Z" />
      </g>
    </svg>
  );
}
