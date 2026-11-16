"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { PillButton } from "@/components/common/pill-button";
import type { ReaderId } from "@/lib/tarot/readers";
import type { Spread } from "@/lib/tarot/spreads";
import { cn } from "@/lib/utils";

import { ReaderPicker } from "./reader-picker";

export const QUESTION_MAX = 200;

interface QuestionStepProps {
  spread: Spread;
  question: string;
  onChange: (question: string) => void;
  readerId: ReaderId;
  onReaderChange: (id: ReaderId) => void;
  onSubmit: () => void;
}

/** Step 1: write the question, with tappable examples (US-02) and the reader picker (US-07). */
export function QuestionStep({
  spread,
  question,
  onChange,
  readerId,
  onReaderChange,
  onSubmit,
}: QuestionStepProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="mx-auto flex max-w-lg flex-col items-center pt-8 text-center"
    >
      <p className="font-display text-champagne text-sm tracking-[0.35em] uppercase">
        {spread.nameEn}
      </p>
      <h1 className="font-serif-tc text-cream title-glow mt-2 text-3xl font-bold tracking-[0.12em]">
        你想問什麼？
      </h1>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        靜下心來，把問題寫下來。問題越具體，牌的回應越清楚。
      </p>

      <form
        className="mt-8 w-full"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!question.trim()) {
            setError("請輸入想問的問題");
            return;
          }
          onSubmit();
        }}
      >
        <label htmlFor="question" className="sr-only">
          你想問什麼？
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => {
            onChange(e.target.value);
            setError(null);
          }}
          rows={3}
          maxLength={QUESTION_MAX}
          aria-invalid={!!error}
          placeholder={spread.examples[0]}
          className="border-champagne-soft bg-surface/50 text-cream placeholder:text-muted-foreground/70 focus:border-champagne w-full resize-none rounded-2xl border px-4 py-3 text-base leading-relaxed focus:outline-none"
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-destructive">{error}</span>
          <span className="text-muted-foreground">
            {question.length} / {QUESTION_MAX}
          </span>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <p className="text-champagne shrink-0 text-xs tracking-[0.2em]">
            試試這些問題
          </p>
          <span
            aria-hidden
            className="from-champagne/40 h-px flex-1 bg-linear-to-r to-transparent"
          />
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {spread.examples.map((example) => {
            const selected = question === example;
            return (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(example);
                    setError(null);
                  }}
                  aria-pressed={selected}
                  className={cn(
                    "group flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-left text-[13px] leading-snug transition",
                    selected
                      ? "border-champagne bg-wine/70 text-cream"
                      : "border-champagne/30 text-cream/80 hover:border-champagne/70 hover:bg-wine/30 hover:text-cream",
                  )}
                >
                  <span aria-hidden className="text-champagne/70 text-[10px]">
                    ✦
                  </span>
                  {example}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-champagne mt-8 text-left text-xs tracking-[0.2em]">
          選擇你的解讀師
        </p>
        <div className="mt-2">
          <ReaderPicker value={readerId} onChange={onReaderChange} />
        </div>

        <PillButton type="submit" className="mt-8 w-full sm:w-auto">
          開始洗牌
        </PillButton>
      </form>
    </motion.section>
  );
}
