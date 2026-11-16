"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { PillButton } from "@/components/common/pill-button";
import {
  fetchSuggestions,
  StreamError,
  streamFromApi,
  THINKING_PAUSE_MS,
  type AiReadingRequest,
} from "@/lib/api/stream";
import type { FollowUpTurn } from "@/lib/history/types";
import type { Reader } from "@/lib/tarot/readers";
import { stripMarkdown } from "@/lib/tarot/safety";
import { cn } from "@/lib/utils";

import { AiNotice } from "./ai-notice";
import { CrisisNotice } from "./crisis-notice";
import { QUESTION_MAX } from "./question-step";
import { ReaderAvatar } from "./reader-avatar";

/** Follow-ups per reading (US-09); the server checks it too. */
export const MAX_FOLLOW_UPS = 5;

interface FollowUpChatProps {
  reader: Reader;
  reading: AiReadingRequest;
  aiReading: string;
  initialTurns?: FollowUpTurn[];
  /** Suggestions saved earlier; when given, the AI is not asked again (US-10 AC3). */
  initialSuggestions?: string[];
  onTurnsChange?: (turns: FollowUpTurn[]) => void;
  onSuggestions?: (suggestions: string[]) => void;
  /** For tests: replace the network calls. */
  stream?: typeof streamFromApi;
  suggest?: typeof fetchSuggestions;
}

interface Pending {
  question: string;
  answer: string;
  status: "loading" | "streaming" | "error";
  error?: string;
  crisis?: boolean;
}

/** Follow-up chat after the reading: suggested questions plus a chat box (US-09, US-10). */
export function FollowUpChat({
  reader,
  reading,
  aiReading,
  initialTurns = [],
  initialSuggestions,
  onTurnsChange,
  onSuggestions,
  stream = streamFromApi,
  suggest = fetchSuggestions,
}: FollowUpChatProps) {
  const [turns, setTurns] = useState<FollowUpTurn[]>(initialTurns);
  const [pending, setPending] = useState<Pending | null>(null);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[] | null>(
    initialSuggestions?.length ? initialSuggestions : null,
  );
  const suggestionsRequested = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const remaining = MAX_FOLLOW_UPS - turns.length;
  const busy = pending?.status === "loading" || pending?.status === "streaming";
  const usedUp = remaining <= 0;

  // Suggested follow-ups: once per reading, then saved with it.
  useEffect(() => {
    if (suggestions || suggestionsRequested.current) return;
    const timer = setTimeout(async () => {
      suggestionsRequested.current = true;
      try {
        const list = await suggest({ ...reading, ai_reading: aiReading });
        setSuggestions(list);
        if (list.length) onSuggestions?.(list);
      } catch {
        setSuggestions([]); // optional help; typing a question still works
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only once on mount
  }, []);

  useEffect(() => {
    if (pending)
      bottomRef.current?.scrollIntoView?.({
        behavior: "smooth",
        block: "nearest",
      });
  }, [pending?.status, turns.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const ask = async (raw: string) => {
    const question = raw.trim();
    if (!question || busy || usedUp) return;
    setInput("");
    setPending({ question, answer: "", status: "loading" });
    try {
      const answer = await stream(
        "/api/v1/ai/follow-up",
        {
          ...reading,
          ai_reading: aiReading,
          history: turns,
          follow_up: question,
        },
        (chunk) =>
          setPending(
            (p) => p && { ...p, status: "streaming", answer: p.answer + chunk },
          ),
        { minDelayMs: THINKING_PAUSE_MS },
      );
      const next = [...turns, { question, answer }];
      setTurns(next);
      setPending(null);
      onTurnsChange?.(next);
    } catch (e) {
      // A failed follow-up does not count; it can be retried.
      setPending(
        (p) =>
          p && {
            ...p,
            status: "error",
            error:
              e instanceof Error
                ? e.message
                : "解讀師暫時沒有回應，請稍後再試一次。",
            crisis: e instanceof StreamError && e.crisis,
          },
      );
    }
  };

  const asked = new Set([...turns.map((t) => t.question), pending?.question]);
  const visibleSuggestions = (suggestions ?? []).filter((s) => !asked.has(s));

  return (
    <section
      className="border-champagne/30 bg-surface/40 mt-4 rounded-2xl border p-4 sm:p-5"
      aria-label="追問解讀師"
    >
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif-tc text-champagne text-base font-bold tracking-[0.15em]">
          繼續問{reader.name}
        </h3>
        <span className="text-muted-foreground text-xs">
          {usedUp ? "追問次數已用完" : `還可以追問 ${remaining} 次`}
        </span>
      </header>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
        針對這次抽到的牌繼續提問，解讀師不會重新抽牌。
      </p>
      <AiNotice className="mt-0.5" />

      <div className="mt-4 flex flex-col gap-3">
        {turns.map((t, i) => (
          <Exchange
            key={i}
            reader={reader}
            question={t.question}
            answer={t.answer}
          />
        ))}
        {pending && (
          <Exchange
            reader={reader}
            question={pending.question}
            answer={pending.answer}
            loading={pending.status === "loading"}
            streaming={pending.status === "streaming"}
          >
            {pending.status === "error" &&
              (pending.crisis ? (
                <CrisisNotice message={pending.error ?? ""} />
              ) : (
                <div className="border-champagne-soft bg-abyss/60 rounded-xl border p-3 text-center">
                  <p className="text-cream text-sm">{pending.error}</p>
                  <div className="mt-2 flex justify-center gap-2">
                    <PillButton
                      variant="ghost"
                      className="px-5 py-2 text-sm"
                      onClick={() => ask(pending.question)}
                    >
                      再試一次
                    </PillButton>
                    <PillButton
                      variant="ghost"
                      className="px-5 py-2 text-sm"
                      onClick={() => setPending(null)}
                    >
                      取消
                    </PillButton>
                  </div>
                </div>
              ))}
          </Exchange>
        )}
        <div ref={bottomRef} />
      </div>

      {usedUp ? (
        <p className="border-champagne-soft bg-abyss/50 text-cream mt-4 rounded-xl border p-4 text-center text-sm leading-relaxed">
          這次的追問就先到這裡吧。讓牌的訊息在心裡沉澱一下，
          <br className="hidden sm:inline" />
          改天帶著新的心情，再來好好占卜一次。
        </p>
      ) : (
        <>
          {!pending && (
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions === null ? (
                <span className="text-muted-foreground animate-pulse text-xs">
                  正在想你可能想問的問題……
                </span>
              ) : (
                visibleSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="border-champagne-soft bg-abyss/40 text-cream hover:border-champagne hover:bg-wine/40 rounded-full border px-3 py-1.5 text-left text-sm transition"
                  >
                    {s}
                  </button>
                ))
              )}
            </div>
          )}

          <form
            className="mt-3 flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter breaks the line; not while choosing IME characters.
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              rows={2}
              maxLength={QUESTION_MAX}
              disabled={busy}
              placeholder="想再問些什麼？"
              aria-label="輸入追問"
              className="border-champagne-soft bg-abyss/50 text-cream placeholder:text-muted-foreground/70 focus:border-champagne min-w-0 flex-1 resize-none rounded-xl border px-3 py-2 text-[15px] leading-relaxed focus:outline-none disabled:opacity-60"
            />
            <PillButton
              type="submit"
              className="shrink-0 px-5 py-2.5"
              disabled={busy || !input.trim()}
            >
              詢問
            </PillButton>
          </form>
        </>
      )}
    </section>
  );
}

/** Split replies longer than two paragraphs into one bubble per paragraph. */
function toBubbles(answer: string): string[] {
  const paragraphs = stripMarkdown(answer)
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length > 2) return paragraphs;
  return paragraphs.length ? [paragraphs.join("\n\n")] : [];
}

function Exchange({
  reader,
  question,
  answer,
  loading = false,
  streaming = false,
  children,
}: {
  reader: Reader;
  question: string;
  answer: string;
  loading?: boolean;
  streaming?: boolean;
  children?: React.ReactNode;
}) {
  const bubbles = toBubbles(answer);
  return (
    <>
      <p className="border-champagne/30 bg-wine/60 text-cream ml-10 self-end rounded-2xl rounded-br-sm border px-4 py-2 text-[15px] leading-relaxed whitespace-pre-wrap">
        {question}
      </p>
      <div className="mr-4 flex items-start gap-2">
        <ReaderAvatar reader={reader} className="mt-1 size-8" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {loading && (
            <p className="text-muted-foreground animate-pulse py-2 text-sm">
              {reader.name}正在看牌……
            </p>
          )}
          {bubbles.map((text, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "border-champagne/20 bg-abyss/50 text-cream rounded-2xl border px-4 py-3 text-[15px] leading-loose whitespace-pre-wrap",
                i === 0 && "rounded-tl-sm",
              )}
            >
              {text}
              {streaming && i === bubbles.length - 1 && (
                <span
                  aria-hidden
                  className="bg-champagne ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse"
                />
              )}
            </motion.p>
          ))}
          {children}
        </div>
      </div>
    </>
  );
}
