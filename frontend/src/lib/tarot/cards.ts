import type { DrawnCard } from "@/lib/api/client";

export type Spread = "daily" | "three_card";
export type Reader = "high_priestess" | "magician" | "fool";

/** The 22 Major Arcana. Ids match cards.json (US-19); minor arcana come later. */
export const MAJOR_ARCANA = [
  { id: "major-00", name: "愚者" },
  { id: "major-01", name: "魔術師" },
  { id: "major-02", name: "女祭司" },
  { id: "major-03", name: "皇后" },
  { id: "major-04", name: "皇帝" },
  { id: "major-05", name: "教皇" },
  { id: "major-06", name: "戀人" },
  { id: "major-07", name: "戰車" },
  { id: "major-08", name: "力量" },
  { id: "major-09", name: "隱者" },
  { id: "major-10", name: "命運之輪" },
  { id: "major-11", name: "正義" },
  { id: "major-12", name: "吊人" },
  { id: "major-13", name: "死神" },
  { id: "major-14", name: "節制" },
  { id: "major-15", name: "惡魔" },
  { id: "major-16", name: "高塔" },
  { id: "major-17", name: "星星" },
  { id: "major-18", name: "月亮" },
  { id: "major-19", name: "太陽" },
  { id: "major-20", name: "審判" },
  { id: "major-21", name: "世界" },
] as const;

export const SPREADS: Record<Spread, { label: string; positions: string[] }> = {
  daily: { label: "每日一牌", positions: ["今日"] },
  three_card: { label: "三張牌陣", positions: ["過去", "現在", "未來"] },
};

export const READERS: Record<Reader, string> = {
  high_priestess: "女祭司",
  magician: "魔術師",
  fool: "愚者",
};

export function cardName(cardId: string): string {
  return MAJOR_ARCANA.find((card) => card.id === cardId)?.name ?? cardId;
}

/** Draw distinct cards for a spread. Temporary until the shuffle UI (US-03, US-04) exists. */
export function drawCards(
  spread: Spread,
  random: () => number = Math.random,
): DrawnCard[] {
  const deck: string[] = MAJOR_ARCANA.map((card) => card.id);
  return SPREADS[spread].positions.map((position) => {
    const [cardId] = deck.splice(Math.floor(random() * deck.length), 1);
    return { position, card_id: cardId, reversed: random() < 0.5 };
  });
}
