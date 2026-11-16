import type { BaseCard, Deck, ReadingItem } from "./decks";
import type { Spread } from "./spreads";

/**
 * A prompt users can paste into ChatGPT, Claude or Gemini. It lists only card names,
 * positions, orientation and keywords, so the other AI interprets freely.
 */
export function buildAiPrompt({
  deck,
  spread,
  question,
  items,
  createdAt,
}: {
  deck: Deck;
  spread: Spread;
  question: string;
  items: ReadingItem<BaseCard>[];
  createdAt: string;
}): string {
  const date = new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Taipei",
  }).format(new Date(createdAt));

  const layout = spread.columns
    ? `${spread.nameZh}（${spread.columns}×${Math.ceil(spread.positions.length / spread.columns)} 排列，依序由左上到右下）`
    : `${spread.nameZh}（${spread.positions.map((p) => p.label).join("／")}）`;

  const cardLines = items.flatMap((it, i) => {
    const orientation = deck.supportsReversed
      ? `・${it.orientation === "reversed" ? "逆位" : "正位"}`
      : "";
    const { keywords } = deck.getInterpretation(it.card, it.orientation);
    return [
      `${i + 1}. ${it.position.label}（${it.position.meaning ?? ""}）：${it.card.nameZh} ${it.card.nameEn}${orientation}`,
      `   關鍵字：${keywords.join("、")}`,
    ];
  });

  return [
    `請你擔任一位溫柔又專業的${deck.nameZh}占卜師，用繁體中文為我解讀這次的占卜。`,
    "",
    `【問題】${question || spread.defaultQuestion}`,
    `【牌系】${deck.nameZh}（${deck.nameEn}）`,
    `【牌陣】${layout}`,
    `【占卜日期】${date}`,
    "",
    "【抽到的牌】",
    ...cardLines,
    "",
    "請依照以下方式解讀：",
    "1. 逐張說明每張牌在它的位置上代表什麼",
    "2. 把所有牌串起來，說明它們之間的關聯與整體故事",
    "3. 針對我的問題，給出具體、可行的建議",
    "4. 語氣溫柔但誠實，不要過度保證結果",
    "",
    deck.aiReadingHint,
  ].join("\n");
}
