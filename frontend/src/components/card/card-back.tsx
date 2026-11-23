import { cn } from "@/lib/utils";

/** Card back; draws the shared <symbol> from CardBackSprite (one copy for all 78 cards). */
export function CardBack({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 240"
      aria-hidden
      className={cn(
        "block aspect-[7/12] rounded-[7%/4%] shadow-lg shadow-black/50",
        className,
      )}
    >
      <use href="#card-back" />
    </svg>
  );
}
