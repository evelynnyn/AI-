"use client";

import { useEffect, useRef, useState } from "react";

import { PillButton } from "@/components/common/pill-button";
import {
  StreamError,
  streamFromApi,
  THINKING_PAUSE_MS,
  type AiReadingRequest,
} from "@/lib/api/stream";
import type { Reader } from "@/lib/tarot/readers";
import { stripMarkdown } from "@/lib/tarot/safety";

import { AiNotice } from "./ai-notice";
import { CrisisNotice } from "./crisis-notice";
import { ReaderAvatar } from "./reader-avatar";

type Status = "idle" | "loading" | "streaming" | "done" | "error";

interface ReaderMessageProps {
  reader: Reader;
  request: AiReadingRequest;
  /** An existing reading (e.g. opened from history); the AI is not called again (US-14 AC4). */
  initialText?: string | null;
  autoStart?: boolean;
  onComplete?: (text: string) => void;
  /** For tests: replaces the network call. */
  stream?: typeof streamFromApi;
}

/** 解讀師的話: the AI reading, shown piece by piece as it streams (US-08). */
export function ReaderMessage({
  reader,
  request,
  initialText,
  autoStart = false,
  onComplete,
  stream = streamFromApi,
}: ReaderMessageProps) {
  const [status, setStatus] = useState<Status>(
    initialText ? "done" : autoStart ? "loading" : "idle",
  );
  const [text, setText] = useState(initialText ?? "");
  const [error, setError] = useState("");
  /** Self-harm signs: show helplines and no retry (SEC-01 AC4). */
  const [crisis, setCrisis] = useState(false);
  const started = useRef(false);

  const start = async () => {
    started.current = true;
    setStatus("loading");
    setText("");
    setError("");
    setCrisis(false);
    try {
      const full = await stream(
        "/api/v1/ai/reading",
        request,
        (chunk) => {
          setStatus("streaming");
          setText((t) => t + chunk);
        },
        { minDelayMs: THINKING_PAUSE_MS },
      );
      setStatus("done");
      onComplete?.(full);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "解讀師暫時沒有回應，請稍後再試一次。",
      );
      setCrisis(e instanceof StreamError && e.crisis);
      setStatus("error");
    }
  };

  // Start once after mounting; dev mode's mount-unmount-mount clears the first timer.
  useEffect(() => {
    if (!autoStart || initialText || started.current) return;
    const timer = setTimeout(start, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start only once on mount
  }, []);

  return (
    <section
      className="border-champagne/60 bg-surface/50 mt-6 rounded-2xl border p-5"
      aria-live="polite"
      aria-label="解讀師的話"
    >
      <header className="flex items-center gap-3">
        <ReaderAvatar reader={reader} className="size-12" />
        <div>
          <h3 className="font-serif-tc text-champagne text-base font-bold tracking-[0.15em]">
            解讀師的話
          </h3>
          <p className="text-cream text-sm">
            {reader.name}
            <span className="text-muted-foreground ml-2 text-xs">
              {reader.tone}
            </span>
          </p>
        </div>
      </header>

      <div className="text-cream mt-4 text-[15px] leading-loose">
        {status === "idle" && (
          <div className="text-center">
            <PillButton onClick={start}>請{reader.name}為我解讀</PillButton>
          </div>
        )}

        {status === "loading" && (
          <p className="text-muted-foreground animate-pulse">
            {reader.name}正在看牌……
          </p>
        )}

        {(status === "streaming" ||
          status === "done" ||
          (status === "error" && text)) && (
          <p className="whitespace-pre-wrap" data-testid="reader-text">
            {stripMarkdown(text)}
            {status === "streaming" && (
              <span
                aria-hidden
                className="bg-champagne ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse"
              />
            )}
          </p>
        )}

        {status === "error" && !crisis && (
          <div className="border-champagne-soft bg-abyss/60 mt-3 rounded-xl border p-4 text-center">
            <p className="text-cream text-sm">{error}</p>
            <PillButton variant="ghost" className="mt-3" onClick={start}>
              再試一次
            </PillButton>
          </div>
        )}

        {status === "error" && crisis && (
          <div className="mt-3">
            <CrisisNotice message={error} />
          </div>
        )}
      </div>

      <AiNotice className="mt-4 text-right" />
    </section>
  );
}
