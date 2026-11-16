"use client";

import { READERS, type ReaderId } from "@/lib/tarot/readers";
import { cn } from "@/lib/utils";

import { ReaderAvatar } from "./reader-avatar";

/** Three reader cards to choose from (US-07). */
export function ReaderPicker({
  value,
  onChange,
}: {
  value: ReaderId;
  onChange: (id: ReaderId) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="選擇解讀師"
      className="grid grid-cols-3 gap-2 sm:gap-3"
    >
      {READERS.map((reader) => {
        const selected = reader.id === value;
        return (
          <button
            key={reader.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(reader.id)}
            className={cn(
              "flex flex-col items-center rounded-2xl border px-2 py-4 text-center transition sm:px-3",
              selected
                ? "border-champagne bg-wine/50 shadow-[0_0_18px_var(--color-champagne-soft)]"
                : "border-champagne/25 bg-surface/50 hover:border-champagne/70",
            )}
          >
            <ReaderAvatar reader={reader} className="size-14 sm:size-16" />
            <span className="font-serif-tc text-cream mt-2 text-base font-bold tracking-[0.1em]">
              {reader.name}
            </span>
            <span className="text-champagne text-[11px] tracking-wide">
              {reader.tone}
            </span>
            <span className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
              {reader.intro}
            </span>
          </button>
        );
      })}
    </div>
  );
}
