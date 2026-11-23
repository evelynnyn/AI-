import { HELPLINES, telHref } from "@/lib/tarot/safety";

/** Shown when the AI declines and the user shows signs of self-harm: a caring message and helplines to call (SEC-01) */
export function CrisisNotice({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-champagne bg-abyss/70 p-5"
    >
      <p className="text-[15px] leading-relaxed text-cream">{message}</p>
      <ul className="mt-4 flex flex-col gap-2">
        {HELPLINES.map((h) => (
          <li
            key={h.name}
            className="flex items-baseline justify-between gap-3 border-b border-champagne/15 pb-2 text-sm"
          >
            <span className="text-cream">
              {h.name}
              {h.note && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {h.note}
                </span>
              )}
            </span>
            <a
              href={telHref(h.number)}
              className="font-sans text-lg font-medium tracking-wider text-champagne tabular-nums"
            >
              {h.number}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
