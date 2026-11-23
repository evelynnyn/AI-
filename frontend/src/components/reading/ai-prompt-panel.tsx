"use client";

import { useRef, useState } from "react";
import { PillButton as Button } from "@/components/common/pill-button";

/** Popular AI chat sites (copy the prompt, paste it in a new tab) */
const AI_LINKS = [
  { name: "ChatGPT", href: "https://chatgpt.com/" },
  { name: "Claude", href: "https://claude.ai/new" },
  { name: "Gemini", href: "https://gemini.google.com/app" },
];

/**
 * "Ask an AI": copy the prompt in one tap, with links to popular AI chats.
 * The preview can also be expanded to select the text by hand (fallback when the clipboard is unavailable).
 */
export function AiPromptPanel({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const copy = async () => {
    let ok = false;
    try {
      // The clipboard API only works on https or localhost
      await navigator.clipboard.writeText(prompt);
      ok = true;
    } catch {
      // Fallback: expand the preview and select it all so the user can copy
      setOpen(true);
      requestAnimationFrame(() => textRef.current?.select());
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-dashed border-champagne-soft bg-surface/40 p-5 text-center">
      <h3 className="font-serif-tc text-base font-bold tracking-[0.15em] text-champagne">
        想聽聽 AI 怎麼說？
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        複製這次占卜的內容，貼到你常用的 AI 取得更完整的解讀。
      </p>

      <Button onClick={copy} className="mt-4 w-full sm:w-auto">
        {copied ? "✓ 已複製" : "複製給 AI 解讀"}
      </Button>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">複製後貼到：</span>
        {AI_LINKS.map((ai) => (
          <a
            key={ai.name}
            href={ai.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-champagne-soft px-3 py-1 text-cream transition hover:border-champagne hover:text-champagne"
          >
            {ai.name} ↗
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-4 text-xs text-muted-foreground underline-offset-4 hover:text-champagne hover:underline"
      >
        {open ? "收起內容" : "預覽要複製的內容"}
      </button>
      {open && (
        <textarea
          ref={textRef}
          readOnly
          value={prompt}
          rows={12}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-3 w-full resize-y rounded-xl border border-champagne/25 bg-abyss/70 p-3 text-left text-xs leading-relaxed text-muted-foreground focus:border-champagne focus:outline-none"
        />
      )}
    </section>
  );
}
