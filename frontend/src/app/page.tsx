import Link from "next/link";

import { CandleOrnament } from "@/components/common/ornament";
import { getDeck, type DeckId } from "@/lib/tarot/decks";
import { SPREAD_LIST } from "@/lib/tarot/spreads";

const DECK_IDS: DeckId[] = ["tarot", "lenormand"];

/** Home: spread entry points grouped by deck (US-01). */
export default function HomePage() {
  return (
    <div className="flex flex-col items-center pt-8 text-center sm:pt-12">
      <CandleOrnament className="mb-4 h-16 w-11" />
      <p className="font-display text-champagne text-sm tracking-[0.4em] uppercase">
        Whispers of the Stars
      </p>
      <h1 className="font-serif-tc text-cream title-glow mt-3 text-4xl font-bold tracking-[0.25em] sm:text-5xl">
        星語塔羅
      </h1>
      <div
        className="text-champagne/70 mt-4 flex items-center gap-3"
        aria-hidden
      >
        <span className="to-champagne/70 h-px w-12 bg-linear-to-r from-transparent" />
        ✦
        <span className="to-champagne/70 h-px w-12 bg-linear-to-l from-transparent" />
      </div>
      <p className="text-muted-foreground mt-4 max-w-sm text-[15px] leading-relaxed">
        靜下心來，帶著你的問題，
        <br />
        讓牌告訴你此刻需要知道的事。
      </p>

      {DECK_IDS.map((deckId) => {
        const deck = getDeck(deckId);
        const spreads = SPREAD_LIST.filter((s) => s.deckId === deckId);
        return (
          <section key={deckId} className="mt-12 w-full max-w-2xl">
            <h2 className="font-serif-tc text-champagne flex items-center justify-center gap-3 text-lg font-bold tracking-[0.3em]">
              <span className="bg-champagne-soft h-px w-8" aria-hidden />
              {deck.nameZh}
              <span className="font-display text-champagne text-sm font-medium tracking-[0.2em]">
                {deck.nameEn}
              </span>
              <span className="bg-champagne-soft h-px w-8" aria-hidden />
            </h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {spreads.map((spread) => (
                <li key={spread.id}>
                  <Link
                    href={`/reading/${spread.id}`}
                    className="group border-champagne/30 bg-surface/50 hover:border-champagne relative flex h-full flex-col items-center overflow-hidden rounded-3xl border px-6 py-7 backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-[0_0_40px_var(--color-champagne-soft)]"
                  >
                    <span className="bg-champagne/10 group-hover:bg-champagne/20 absolute -top-16 -right-16 size-40 rounded-full blur-2xl transition" />
                    <span className="border-champagne/70 text-champagne flex size-14 items-center justify-center rounded-full border text-2xl">
                      {spread.icon}
                    </span>
                    <span className="font-serif-tc text-cream mt-4 text-2xl font-bold tracking-[0.15em]">
                      {spread.nameZh}
                    </span>
                    <span className="font-display text-champagne mt-1 text-sm tracking-[0.2em]">
                      {spread.nameEn} · {spread.positions.length} 張
                    </span>
                    <span className="text-muted-foreground mt-3 text-sm leading-relaxed">
                      {spread.description}
                    </span>
                    <span className="text-champagne mt-5 text-sm tracking-[0.2em] transition group-hover:translate-x-1">
                      開始占卜 →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
