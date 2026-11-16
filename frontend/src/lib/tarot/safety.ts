/** Taiwan helplines shown with the crisis message (SEC-01); same list as the server prompt. */
export const HELPLINES = [
  { name: "安心專線", number: "1925", note: "24 小時" },
  { name: "生命線", number: "1995", note: "24 小時" },
  { name: "張老師專線", number: "1980", note: "" },
  { name: "緊急求助", number: "119／110", note: "有立即危險時" },
] as const;

/** tel: link for a helpline; "119／110" dials the first number. */
export function telHref(number: string): string {
  return `tel:${number.split("／")[0]}`;
}

/** Strip Markdown the model sometimes still writes (** bold, # headings). */
export function stripMarkdown(text: string): string {
  return text.replace(/\*\*/g, "").replace(/^#{1,6}\s*/gm, "");
}
