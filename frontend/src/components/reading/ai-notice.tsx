/** 小字標示：解讀內容由 AI 產生 */
export function AiNotice({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[11px] tracking-wider text-muted-foreground ${className}`}
    >
      解讀由 AI 產生
    </p>
  );
}
