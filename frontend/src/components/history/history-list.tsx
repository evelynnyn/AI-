"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { PillLink } from "@/components/common/pill-button";
import { ReaderSection } from "@/components/reading/reader-section";
import { ReadingResult } from "@/components/reading/reading-result";
import { subscribeLocal } from "@/lib/history/local-store";
import type { ReadingStore, SavedReading } from "@/lib/history/types";
import { cardName } from "@/lib/tarot/decks";
import { findReader } from "@/lib/tarot/readers";
import { SPREADS, isSpreadId } from "@/lib/tarot/spreads";

const dateFormat = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Taipei",
});

/** Saved readings; tap one to see the full result, AI reading and follow-ups (US-14). */
export function HistoryList({ store }: { store: ReadingStore | null }) {
  const [readings, setReadings] = useState<SavedReading[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!store) return;
    store
      .list()
      .then((list) => {
        setReadings(list);
        setError(null);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "無法載入占卜紀錄"),
      );
  }, [store]);

  useEffect(() => {
    load();
    if (store?.kind === "local") return subscribeLocal(load);
  }, [store, load]);

  const remove = async (id: string) => {
    if (!store || !window.confirm("確定要刪除這筆占卜紀錄嗎？")) return;
    try {
      await store.remove(id);
      setReadings((list) => list?.filter((r) => r.id !== id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "刪除失敗，請稍後再試一次");
    }
  };

  if (error) {
    return (
      <p role="alert" className="text-destructive mt-16 text-center text-sm">
        無法載入占卜紀錄：{error}
      </p>
    );
  }
  if (!readings) {
    return (
      <p className="text-muted-foreground mt-16 text-center text-sm">讀取中…</p>
    );
  }
  if (readings.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center gap-6 text-center">
        <p className="text-muted-foreground">
          還沒有占卜紀錄，先來抽第一次牌吧！
        </p>
        <PillLink href="/">開始第一次占卜</PillLink>
      </div>
    );
  }

  return (
    <ul className="mt-8 flex flex-col gap-3">
      {readings
        .filter((r) => isSpreadId(r.spread))
        .map((reading) => (
          <HistoryItem
            key={reading.id}
            reading={reading}
            store={store}
            open={openId === reading.id}
            onToggle={() =>
              setOpenId(openId === reading.id ? null : reading.id)
            }
            onDelete={() => remove(reading.id)}
          />
        ))}
    </ul>
  );
}

function HistoryItem({
  reading,
  store,
  open,
  onToggle,
  onDelete,
}: {
  reading: SavedReading;
  store: ReadingStore | null;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const spread = SPREADS[reading.spread];
  const reader = findReader(reading.reader);

  return (
    <li className="border-champagne/25 bg-surface/50 overflow-hidden rounded-2xl border backdrop-blur-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full px-4 py-4 text-left sm:px-5"
      >
        <div className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
          <span>{dateFormat.format(new Date(reading.created_at))}</span>
          <span className="flex gap-1.5">
            <span className="border-champagne-soft text-cream rounded-full border px-2 py-px">
              {reader.name}
            </span>
            {reading.follow_ups.length > 0 && (
              <span className="border-champagne-soft text-cream rounded-full border px-2 py-px">
                追問 {reading.follow_ups.length}
              </span>
            )}
            <span className="border-champagne-soft text-champagne rounded-full border px-2 py-px">
              {spread.nameZh}
            </span>
          </span>
        </div>
        <p className="font-serif-tc text-cream mt-2 truncate text-base font-bold">
          {reading.question}
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {reading.cards.map((c) => (
            <li
              key={c.position}
              className="bg-abyss/60 text-cream rounded-full px-2.5 py-0.5 text-xs"
            >
              {cardName(c.card_id)}
              {c.reversed && (
                <span className="text-champagne font-bold">・逆</span>
              )}
            </li>
          ))}
        </ul>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="border-champagne/20 border-t px-3 pt-5 pb-4 sm:px-5">
              <ReadingResult
                spread={spread}
                question={reading.question}
                cards={reading.cards}
                createdAt={reading.created_at}
                extra={
                  <ReaderSection
                    reader={reader}
                    reading={{
                      reader: reading.reader,
                      spread: reading.spread,
                      question: reading.question,
                      cards: reading.cards.map(({ card_id, reversed }) => ({
                        card_id,
                        reversed,
                      })),
                    }}
                    recordId={reading.id}
                    store={store}
                    initialAiReading={reading.interpretation}
                    initialFollowUps={reading.follow_ups}
                    initialSuggestions={reading.suggestions}
                  />
                }
              />
              <div className="mt-4 text-right">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-champagne text-xs"
                  onClick={onDelete}
                >
                  刪除這筆紀錄
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
