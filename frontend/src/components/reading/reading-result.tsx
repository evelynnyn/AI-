import type { ReactNode } from "react";

import { CardFace } from "@/components/card/card-face";
import { RoseCorner } from "@/components/common/ornament";
import type { DrawnCard } from "@/lib/api/client";
import { buildAiPrompt } from "@/lib/tarot/ai-prompt";
import {
  findCard,
  getDeck,
  type BaseCard,
  type ReadingItem,
} from "@/lib/tarot/decks";
import type { Spread } from "@/lib/tarot/spreads";

import { AiPromptPanel } from "./ai-prompt-panel";

interface ReadingResultProps {
  spread: Spread;
  question: string;
  cards: DrawnCard[];
  createdAt: string;
  /** Shown after the card meanings, before the copy-to-AI panel (the AI reader). */
  extra?: ReactNode;
  showHeader?: boolean;
}

/** Summary plus each card's position, keywords and meaning (US-06). Used by the flow and history. */
export function ReadingResult({
  spread,
  question,
  cards,
  createdAt,
  extra,
  showHeader = true,
}: ReadingResultProps) {
  const deck = getDeck(spread.deckId);
  const items: ReadingItem<BaseCard>[] = cards.flatMap((drawn, i) => {
    const card = findCard(spread.deckId, drawn.card_id);
    const position = spread.positions[i];
    return card && position
      ? [
          {
            card,
            orientation: drawn.reversed ? "reversed" : "upright",
            position,
          },
        ]
      : [];
  });
  const summary = deck.summarize(items);
  const aiPrompt = buildAiPrompt({ deck, spread, question, items, createdAt });

  return (
    <article className="mx-auto w-full max-w-2xl">
      {showHeader && (
        <header className="mb-6 text-center">
          <p className="font-display text-champagne text-xs tracking-[0.35em] uppercase">
            {spread.nameEn}
          </p>
          <h2 className="font-serif-tc text-cream title-glow mt-1 text-xl font-bold tracking-[0.08em]">
            {question}
          </h2>
        </header>
      )}

      {summary.length > 0 && (
        <section className="border-champagne/60 from-surface to-abyss/80 relative overflow-hidden rounded-2xl border bg-linear-to-b p-5 backdrop-blur-sm">
          <RoseCorner className="absolute top-1 left-1 size-14 opacity-60" />
          <RoseCorner className="absolute right-1 bottom-1 size-14 rotate-180 opacity-60" />
          <h3 className="font-serif-tc text-champagne relative flex items-center justify-center gap-2 text-base font-bold tracking-[0.2em]">
            <span aria-hidden>✦</span>綜合解讀
          </h3>
          <div className="text-cream relative mt-3 flex flex-col gap-2.5 text-[15px] leading-relaxed">
            {summary.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>
      )}

      <ol className="mt-4 flex flex-col gap-4">
        {items.map(({ card, orientation, position }) => {
          const reversed = orientation === "reversed";
          const { keywords, meaning } = deck.getInterpretation(
            card,
            orientation,
          );
          return (
            <li
              key={position.id}
              className="border-champagne/25 bg-surface/50 flex gap-4 rounded-2xl border p-4 backdrop-blur-sm"
            >
              <CardFace
                card={card}
                face={deck.getFaceInfo(card)}
                reversed={reversed}
                className="w-16 shrink-0 self-start sm:w-20"
                sizes="80px"
              />
              <div className="min-w-0 flex-1">
                <p className="text-champagne text-xs tracking-[0.15em]">
                  {position.label}
                  <span className="text-muted-foreground ml-2 tracking-normal">
                    {position.meaning}
                  </span>
                </p>
                <h3 className="font-serif-tc text-cream mt-1 flex flex-wrap items-baseline gap-x-2 text-lg font-bold">
                  {card.nameZh}
                  <span className="font-display text-muted-foreground text-sm font-medium italic">
                    {card.nameEn}
                  </span>
                  {deck.supportsReversed && (
                    <span
                      className={
                        reversed
                          ? "border-wine-bright bg-wine-bright text-cream rounded-full border px-2 py-px font-sans text-[11px] font-normal"
                          : "border-champagne text-champagne rounded-full border px-2 py-px font-sans text-[11px] font-normal"
                      }
                    >
                      {reversed ? "逆位" : "正位"}
                    </span>
                  )}
                </h3>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {keywords.map((k) => (
                    <li
                      key={k}
                      className="bg-abyss/60 text-muted-foreground rounded-full px-2.5 py-0.5 text-xs"
                    >
                      {k}
                    </li>
                  ))}
                </ul>
                <p className="text-cream mt-2 text-[15px] leading-relaxed">
                  {meaning}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {extra}

      <AiPromptPanel prompt={aiPrompt} />
    </article>
  );
}
