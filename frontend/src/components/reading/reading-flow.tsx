"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { PillButton, PillLink } from "@/components/common/pill-button";
import { useReadingStore } from "@/hooks/use-reading-store";
import type { DrawnCard } from "@/lib/api/client";
import type { AiReadingRequest } from "@/lib/api/stream";
import { findCard, getDeck } from "@/lib/tarot/decks";
import {
  DEFAULT_READER_ID,
  findReader,
  type ReaderId,
} from "@/lib/tarot/readers";
import { shuffleDeck, type PileCard } from "@/lib/tarot/shuffle";
import { SPREADS, type SpreadId } from "@/lib/tarot/spreads";

import { CardFan, type FanOrigin } from "./card-fan";
import { FlyingCard, type Flight } from "./flying-card";
import { QuestionStep } from "./question-step";
import { ReaderSection } from "./reader-section";
import { ReadingResult } from "./reading-result";
import { ShuffleStep } from "./shuffle-step";
import { SpreadBoard, type SlotCard } from "./spread-board";

type Phase = "question" | "shuffle" | "pick" | "reveal";

/**
 * The reading ritual: question → shuffle → pick from the fan (cards fly to the spread)
 * → flip one by one → result (US-01..US-06). Saved as soon as every card is drawn (US-13).
 */
export function ReadingFlow({ spreadId }: { spreadId: SpreadId }) {
  const spread = SPREADS[spreadId];
  const deck = getDeck(spread.deckId);
  const need = spread.positions.length;
  const store = useReadingStore();

  const [phase, setPhase] = useState<Phase>("question");
  const [question, setQuestion] = useState("");
  const [readerId, setReaderId] = useState<ReaderId>(DEFAULT_READER_ID);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [createdAt, setCreatedAt] = useState(() => new Date().toISOString());
  const [shuffled, setShuffled] = useState<PileCard[]>([]);
  /** Index in the shuffled pile for each spread position, in order. */
  const [pickedIdx, setPickedIdx] = useState<number[]>([]);
  const [placed, setPlaced] = useState<boolean[]>(() =>
    Array(need).fill(false),
  );
  const [flipped, setFlipped] = useState<boolean[]>(() =>
    Array(need).fill(false),
  );
  const [flights, setFlights] = useState<Flight[]>([]);
  const [showResult, setShowResult] = useState(false);

  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const pickedSet = useMemo(() => new Set(pickedIdx), [pickedIdx]);
  const drawn: DrawnCard[] = pickedIdx.map((i, slot) => ({
    position: spread.positions[slot].id,
    card_id: shuffled[i].cardId,
    reversed: shuffled[i].orientation === "reversed",
  }));

  const slotCards: (SlotCard | null)[] = spread.positions.map((_, slot) => {
    const d = drawn[slot];
    const card = d && findCard(spread.deckId, d.card_id);
    return card
      ? { card, face: deck.getFaceInfo(card), reversed: d.reversed ?? false }
      : null;
  });

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleShuffled = () => {
    setShuffled(shuffleDeck(deck.cards, deck.supportsReversed));
    setPhase("pick");
    scrollTop();
  };

  const markPlaced = (slot: number) =>
    setPlaced((p) => p.map((v, i) => v || i === slot));

  const save = (cards: DrawnCard[]) => {
    if (!store) return;
    setCreatedAt(new Date().toISOString());
    store
      .create({
        question: question.trim(),
        spread: spreadId,
        reader: readerId,
        cards,
      })
      .then((saved) => setRecordId(saved.id))
      .catch(() => setSaveFailed(true));
  };

  const handlePick = (index: number, from: FanOrigin) => {
    if (pickedIdx.length >= need || pickedSet.has(index)) return;
    const slot = pickedIdx.length;
    const next = [...pickedIdx, index];
    setPickedIdx(next);

    const target = slotRefs.current[slot]?.getBoundingClientRect();
    if (target) {
      setFlights((f) => [
        ...f,
        {
          key: `${index}-${slot}`,
          slot,
          from,
          to: { left: target.left, top: target.top, width: target.width },
        },
      ]);
    } else {
      markPlaced(slot);
    }

    if (next.length === need) {
      save(
        next.map((i, s) => ({
          position: spread.positions[s].id,
          card_id: shuffled[i].cardId,
          reversed: shuffled[i].orientation === "reversed",
        })),
      );
    }
  };

  const allPlaced = placed.every(Boolean);
  const allFlipped = flipped.every(Boolean);

  useEffect(() => {
    if (phase !== "pick" || !allPlaced) return;
    const t = setTimeout(() => setPhase("reveal"), 350);
    return () => clearTimeout(t);
  }, [phase, allPlaced]);

  useEffect(() => {
    if (phase !== "reveal" || !allFlipped) return;
    const t = setTimeout(() => {
      setShowResult(true);
      setTimeout(
        () =>
          resultRef.current?.scrollIntoView?.({
            behavior: "smooth",
            block: "start",
          }),
        100,
      );
    }, 900);
    return () => clearTimeout(t);
  }, [phase, allFlipped]);

  const handleLanded = (flight: Flight) => {
    setFlights((f) => f.filter((x) => x.key !== flight.key));
    markPlaced(flight.slot);
  };

  const flip = (slot: number) =>
    setFlipped((f) => f.map((v, i) => v || i === slot));
  const flipAll = () =>
    spread.positions.forEach((_, i) => setTimeout(() => flip(i), i * 250));

  const restart = () => {
    setPhase("question");
    setQuestion("");
    setShuffled([]);
    setPickedIdx([]);
    setPlaced(Array(need).fill(false));
    setFlipped(Array(need).fill(false));
    setFlights([]);
    setShowResult(false);
    setRecordId(null);
    setSaveFailed(false);
    scrollTop();
  };

  const reader = findReader(readerId);
  const aiRequest: AiReadingRequest = {
    reader: readerId,
    spread: spreadId,
    question: question.trim(),
    cards: drawn.map(({ card_id, reversed }) => ({ card_id, reversed })),
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {phase === "question" && (
          <QuestionStep
            key="question"
            spread={spread}
            question={question}
            onChange={setQuestion}
            readerId={readerId}
            onReaderChange={setReaderId}
            onSubmit={() => {
              setPhase("shuffle");
              scrollTop();
            }}
          />
        )}

        {phase === "shuffle" && (
          <ShuffleStep key="shuffle" onDone={handleShuffled} />
        )}

        {(phase === "pick" || phase === "reveal") && (
          <motion.section
            key="board"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center pt-6 text-center"
          >
            <p className="font-display text-champagne text-xs tracking-[0.35em] uppercase">
              {spread.nameEn}
            </p>
            <h1 className="font-serif-tc text-cream title-glow mt-1 text-xl font-bold tracking-[0.08em] sm:text-2xl">
              {question.trim()}
            </h1>
            <p className="text-muted-foreground mt-2 min-h-5 text-sm">
              {phase === "pick"
                ? pickedIdx.length < need
                  ? `憑直覺抽出第 ${pickedIdx.length + 1} 張牌：「${spread.positions[pickedIdx.length].label}」（${pickedIdx.length} / ${need}）`
                  : "牌已抽齊"
                : allFlipped
                  ? "牌已全部翻開"
                  : "輕觸牌卡，一張一張翻開"}
            </p>

            <div className="mt-6">
              <SpreadBoard
                positions={spread.positions}
                columns={spread.columns}
                deckHasReversed={deck.supportsReversed}
                cards={slotCards}
                placed={placed}
                flipped={flipped}
                canFlip={phase === "reveal"}
                onFlip={flip}
                slotRefs={slotRefs}
              />
            </div>

            <AnimatePresence>
              {phase === "pick" && (
                <motion.div
                  key="fan"
                  className="mt-4 w-full"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 60, transition: { duration: 0.4 } }}
                >
                  <CardFan
                    count={shuffled.length}
                    picked={pickedSet}
                    disabled={pickedIdx.length >= need}
                    onPick={handlePick}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {phase === "reveal" && !allFlipped && need > 1 && (
              <PillButton variant="ghost" className="mt-8" onClick={flipAll}>
                全部翻開
              </PillButton>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResult && (
          <motion.div
            ref={resultRef}
            key="result"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="scroll-mt-20 pt-8"
          >
            {saveFailed && (
              <p
                role="status"
                className="border-champagne-soft text-muted-foreground mx-auto mb-4 max-w-2xl rounded-xl border px-4 py-2 text-center text-sm"
              >
                這次的紀錄沒有保存成功，但你仍然可以看完解讀。
              </p>
            )}
            <ReadingResult
              spread={spread}
              question={question.trim()}
              cards={drawn}
              createdAt={createdAt}
              showHeader={false}
              extra={
                <ReaderSection
                  reader={reader}
                  reading={aiRequest}
                  recordId={recordId}
                  store={store}
                  autoStart
                />
              }
            />
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PillButton onClick={restart}>再占一次</PillButton>
              <PillLink href="/readings" variant="ghost">
                查看紀錄
              </PillLink>
            </div>
            <p className="text-muted-foreground mt-8 text-center text-xs">
              塔羅是自我覺察的鏡子，而非命定的答案。最終的選擇，永遠在你手中。
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {flights.map((f) => (
        <FlyingCard key={f.key} flight={f} onLanded={() => handleLanded(f)} />
      ))}
    </>
  );
}
