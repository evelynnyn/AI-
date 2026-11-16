import type { Reading } from "@/lib/api/client";

export type ReaderId = Reading["reader"];

/**
 * What the reader picker shows (US-07). Each reader's prompt lives only on the
 * server (backend/app/catalog/readers.json, SEC-03).
 */
export interface Reader {
  id: ReaderId;
  name: string;
  nameEn: string;
  intro: string;
  /** Under public/readers/; a gold line placeholder is shown when missing. */
  avatar: string;
  placeholderGlyph: string;
  tone: string;
}

export const READERS: Reader[] = [
  {
    id: "high-priestess",
    name: "女祭司",
    nameEn: "The High Priestess",
    intro: "在月光下傾聽你的心，溫柔陪你看見內在的答案。",
    avatar: "/readers/high-priestess.png",
    placeholderGlyph: "☽",
    tone: "溫柔・療癒・重視直覺",
  },
  {
    id: "magician",
    name: "魔術師",
    nameEn: "The Magician",
    intro: "直白犀利、重點先講，把牌義變成你今天就能做的行動。",
    avatar: "/readers/magician.png",
    placeholderGlyph: "∞",
    tone: "直白・犀利・重視行動",
  },
  {
    id: "fool",
    name: "愚者",
    nameEn: "The Fool",
    intro: "輕鬆幽默的冒險家，陪你用好奇心看待每一種可能。",
    avatar: "/readers/fool.png",
    placeholderGlyph: "✦",
    tone: "輕鬆・幽默・樂觀",
  },
];

export const DEFAULT_READER_ID: ReaderId = "high-priestess";

export function findReader(id: string | undefined): Reader {
  return READERS.find((r) => r.id === id) ?? READERS[0];
}
