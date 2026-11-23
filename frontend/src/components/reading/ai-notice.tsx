/** Small print: the reading was written by AI (US-11) */
export function AiNotice({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[11px] tracking-wider text-muted-foreground ${className}`}
    >
      解讀由 AI 產生
    </p>
  );
}
