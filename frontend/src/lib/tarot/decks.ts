import lenormandJson from "@/data/catalog/lenormand_cards.json";
import tarotJson from "@/data/catalog/tarot_cards.json";

/**
 * Decks share one interface, so the shuffle, fan, flip and result components
 * never depend on a particular deck. Card data are copies of backend/app/catalog.
 */

export type Orientation = "upright" | "reversed";
export type DeckId = "tarot" | "lenormand";
export type TarotSuit = "wands" | "cups" | "swords" | "pentacles";

export interface BaseCard {
  id: string;
  nameZh: string;
  nameEn: string;
  /** Illustration (e.g. /cards/fool.webp); null shows a text card (US-20). */
  image: string | null;
}

export interface TarotCard extends BaseCard {
  arcana: "major" | "minor";
  suit: TarotSuit | null;
  /** Major 0–21; minor 1–14 (1 = Ace, 11–14 = Page, Knight, Queen, King). */
  number: number;
  uprightKeywords: string[];
  reversedKeywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
}

export interface LenormandCard extends BaseCard {
  number: number;
  /** Playing card in the corner, e.g. "9♥". */
  playingCard: string;
  keywords: string[];
  meaning: string;
  /** 1 positive, 0 neutral, -1 negative (used by the summary). */
  tone: -1 | 0 | 1;
}

export interface CardFaceInfo {
  /** Corner label, e.g. "XVII", "A", "K". */
  label: string;
  symbol?: string;
  /** Line icon paths (viewBox 0 0 24 24). */
  iconPaths?: string[];
  accentClass: string;
}

export interface CardInterpretation {
  keywords: string[];
  meaning: string;
}

export interface ReadingItem<C extends BaseCard = BaseCard> {
  card: C;
  orientation: Orientation;
  position: { id: string; label: string; meaning?: string };
}

export interface Deck<C extends BaseCard = BaseCard> {
  id: DeckId;
  nameZh: string;
  nameEn: string;
  cards: C[];
  supportsReversed: boolean;
  /** Hint appended to the prompt users can copy to another AI. */
  aiReadingHint: string;
  getFaceInfo: (card: C) => CardFaceInfo;
  getInterpretation: (card: C, orientation: Orientation) => CardInterpretation;
  summarize: (items: ReadingItem<C>[]) => string[];
}

// ---------------------------------------------------------------------------
// Tarot
// ---------------------------------------------------------------------------

const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
  "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"]; // prettier-ignore
const MINOR_LABEL = [
  "",
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "P",
  "Kn",
  "Q",
  "K",
];
/** Golden Dawn symbols; ︎ keeps iOS from drawing them as emoji. */
const MAJOR_SYMBOL = ["✦", "☿", "☽", "♀", "♈", "♉", "♊", "♋", "♌", "♍", "♃", "♎",
  "▽", "♏", "♐", "♑", "♂", "♒", "♓", "☉", "△", "♄"].map((s) => s + "︎"); // prettier-ignore

const SUIT_ICON: Record<TarotSuit, string[]> = {
  wands: ["M6 21 18 3", "M11 13.5c1.6-1.3 3.2-1.3 4.4-.3", "M9.4 16c-1.2-1.6-1.3-3-.4-4.3", "M14.8 7.6c1.3-.9 2.6-.7 3.6.3"],
  cups: ["M6 4h12c0 5-2.6 8-6 8s-6-3-6-8Z", "M12 12v6", "M8 20h8"],
  swords: ["M12 2.5 13.4 5v10h-2.8V5Z", "M8 15h8", "M12 15v5", "M10 21h4"],
  pentacles: ["M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 1 0 0-19Z", "M12 4.6 16.3 17.9 5 9.7h14L7.7 17.9Z"],
}; // prettier-ignore

export const SUIT_INFO: Record<TarotSuit, { nameZh: string; element: string; accentClass: string; theme: string }> = {
  wands: { nameZh: "權杖", element: "火", accentClass: "text-wine", theme: "行動、熱情與事業" },
  cups: { nameZh: "聖杯", element: "水", accentClass: "text-surface", theme: "情感、關係與直覺" },
  swords: { nameZh: "寶劍", element: "風", accentClass: "text-abyss", theme: "思考、溝通與衝突" },
  pentacles: { nameZh: "錢幣", element: "土", accentClass: "text-wine-bright", theme: "金錢、工作與身體" },
}; // prettier-ignore

const tarotName = (it: ReadingItem<TarotCard>) =>
  `「${it.card.nameZh}」${it.orientation === "reversed" ? "逆位" : ""}`;
const tarotKeywords = (it: ReadingItem<TarotCard>) =>
  (it.orientation === "upright"
    ? it.card.uprightKeywords
    : it.card.reversedKeywords
  )
    .slice(0, 2)
    .join("、");

/** Rule-based tarot summary: story line, overall energy, then advice from the last card. */
export function summarizeTarot(items: ReadingItem<TarotCard>[]): string[] {
  const out: string[] = [];
  if (items.length === 0) return out;

  if (items.length === 1) {
    const it = items[0];
    out.push(`你抽到了${tarotName(it)}，關鍵字是「${tarotKeywords(it)}」。`);
    if (it.card.arcana === "major") {
      out.push(
        "這是一張大阿爾克那，代表今天的訊息與較深層的人生課題有關，值得放慢腳步細細體會。",
      );
    } else {
      const suit = SUIT_INFO[it.card.suit!];
      out.push(
        `${suit.nameZh}牌屬於${suit.element}元素，提醒你今天把心思放在${suit.theme}上。`,
      );
    }
    out.push(
      it.orientation === "upright"
        ? "正位的能量流動順暢，今天適合主動出擊，照著牌的提示去行動。"
        : "逆位代表能量受阻或轉向內在。今天不妨先停下來，覺察是什麼讓你卡住了。",
    );
    return out;
  }

  const byId = Object.fromEntries(items.map((it) => [it.position.id, it]));
  const { past, present, future } = byId;
  if (past && present && future) {
    out.push(
      `回顧過去，${tarotName(past)}帶來「${tarotKeywords(past)}」的影響；此刻，${tarotName(present)}點出「${tarotKeywords(present)}」是你正在面對的課題；照目前的方向走下去，未來會遇見${tarotName(future)}所代表的「${tarotKeywords(future)}」。`,
    );
  } else {
    out.push(
      items
        .map(
          (it) =>
            `「${it.position.label}」是${tarotName(it)}（${tarotKeywords(it)}）`,
        )
        .join("；") + "。",
    );
  }

  const total = items.length;
  const majors = items.filter((it) => it.card.arcana === "major").length;
  const reversed = items.filter((it) => it.orientation === "reversed").length;
  const energy: string[] = [];

  if (majors / total >= 0.5) {
    energy.push(
      `${total} 張牌中有 ${majors} 張大阿爾克那，這件事牽涉人生的重要課題，背後有比你想像更大的力量在推動，順勢而為會比硬碰硬更有效。`,
    );
  } else if (majors === 0) {
    energy.push(
      "沒有出現大阿爾克那，這件事主要掌握在你自己的日常選擇裡，改變的鑰匙就在你手上。",
    );
  }

  const suitCount = new Map<TarotSuit, number>();
  items.forEach(
    (it) =>
      it.card.suit &&
      suitCount.set(it.card.suit, (suitCount.get(it.card.suit) ?? 0) + 1),
  );
  const [top, second] = [...suitCount.entries()].sort((a, b) => b[1] - a[1]);
  if (top && top[1] >= 2 && (!second || top[1] > second[1])) {
    const suit = SUIT_INFO[top[0]];
    energy.push(
      `${suit.nameZh}牌最多（${suit.element}元素），重點落在${suit.theme}。`,
    );
  }

  if (reversed === 0)
    energy.push("全部都是正位，能量流動順暢，是向外行動、推進計畫的好時機。");
  else if (reversed / total >= 0.5)
    energy.push(
      `有 ${reversed} 張逆位牌，能量有些受阻或轉向內在，先處理心裡的卡關，再急著向外推進。`,
    );

  const courts = items.filter(
    (it) => it.card.arcana === "minor" && it.card.number >= 11,
  );
  if (courts.length >= 2) {
    energy.push(
      "出現多張宮廷牌，身邊的人在這件事中扮演重要角色，或你需要展現某種性格特質。",
    );
  }
  if (items.some((it) => it.card.arcana === "minor" && it.card.number === 1)) {
    energy.push("出現了王牌，新的種子正在萌芽，留意剛出現的機會。");
  }
  if (energy.length) out.push(energy.join(""));

  const last = items[items.length - 1];
  out.push(
    last.orientation === "upright"
      ? `最後一張${tarotName(last)}是正位，整體走向是開展的，順著現在的節奏前進即可。`
      : `最後一張${tarotName(last)}是逆位，若不做調整，眼前的阻礙可能會延續。不妨從「${items[Math.floor(total / 2)].position.label}」那張牌的課題著手，改變會從那裡開始。`,
  );
  return out;
}

export const tarotDeck: Deck<TarotCard> = {
  id: "tarot",
  nameZh: "塔羅牌",
  nameEn: "Tarot",
  cards: tarotJson as TarotCard[],
  supportsReversed: true,
  aiReadingHint:
    "請以偉特塔羅（Rider-Waite-Smith）的傳統牌義為基礎，並注意正位與逆位的差異。",
  getFaceInfo(card) {
    if (card.arcana === "major") {
      return {
        label: ROMAN[card.number],
        symbol: MAJOR_SYMBOL[card.number],
        accentClass: "text-wine",
      };
    }
    const suit = card.suit!;
    return {
      label: MINOR_LABEL[card.number],
      iconPaths: SUIT_ICON[suit],
      accentClass: SUIT_INFO[suit].accentClass,
    };
  },
  getInterpretation(card, orientation) {
    return orientation === "upright"
      ? { keywords: card.uprightKeywords, meaning: card.uprightMeaning }
      : { keywords: card.reversedKeywords, meaning: card.reversedMeaning };
  },
  summarize: summarizeTarot,
};

// ---------------------------------------------------------------------------
// Lenormand
// ---------------------------------------------------------------------------

const lenName = (it: ReadingItem<LenormandCard>) => `「${it.card.nameZh}」`;
const firstKeyword = (it: ReadingItem<LenormandCard>) => it.card.keywords[0];
const toneOf = (list: ReadingItem<LenormandCard>[]) =>
  list.reduce((sum, it) => sum + it.card.tone, 0);

function toneSentence(score: number, scope: string) {
  if (score > 0) return `${scope}偏向正面，整體是順利、有助力的。`;
  if (score < 0) return `${scope}帶有考驗，需要多一點耐心與謹慎。`;
  return `${scope}正負交織，結果取決於你接下來怎麼選擇。`;
}

/** Rule-based Lenormand summary: cards are read together, like a sentence. */
export function summarizeLenormand(
  items: ReadingItem<LenormandCard>[],
): string[] {
  const out: string[] = [];
  if (items.length === 3) {
    const [a, b, c] = items;
    out.push(
      `這組牌讀起來像一句話：以${lenName(a)}的「${firstKeyword(a)}」開端，經過${lenName(b)}的「${firstKeyword(b)}」，最後走向${lenName(c)}的「${firstKeyword(c)}」。`,
    );
    out.push(`中間的${lenName(b)}是整件事的重心：${b.card.meaning}`);
    out.push(toneSentence(toneOf(items), "牌面"));
  } else if (items.length === 9) {
    const center = items[4];
    out.push(`九宮格的核心是${lenName(center)}：${center.card.meaning}`);
    const corners = [0, 2, 6, 8].map((i) => items[i]);
    out.push(
      `四個角落的${corners.map(lenName).join("、")}構成這件事的背景框架。`,
    );
    const future = [2, 5, 8].map((i) => items[i]);
    out.push(
      `未來那一欄（${future.map(lenName).join("、")}）${toneSentence(toneOf(future), "")}`,
    );
    out.push(toneSentence(toneOf(items), "整體牌面"));
  } else {
    out.push(
      items
        .map(
          (it) =>
            `「${it.position.label}」是${lenName(it)}（${it.card.keywords.join("、")}）`,
        )
        .join("；") + "。",
    );
    out.push(toneSentence(toneOf(items), "牌面"));
  }

  const people = items
    .filter((it) => it.card.id === "man" || it.card.id === "woman")
    .map((it) => it.card.nameZh);
  if (people.length) {
    out.push(
      `牌中出現了「${people.join("」與「")}」，這件事與某位關鍵人物（也可能就是你自己）密切相關。`,
    );
  }
  return out;
}

export const lenormandDeck: Deck<LenormandCard> = {
  id: "lenormand",
  nameZh: "雷諾曼",
  nameEn: "Lenormand",
  cards: lenormandJson as LenormandCard[],
  supportsReversed: false,
  aiReadingHint:
    "雷諾曼牌不分正逆位，請把相鄰的牌組合起來讀：前一張牌是主題，後一張牌描述它的性質或走向。",
  getFaceInfo(card) {
    const red = /[♥♦]/.test(card.playingCard);
    return {
      label: String(card.number),
      symbol: card.playingCard.replace(/([♥♦♠♣])/, "$1︎"),
      accentClass: red ? "text-wine" : "text-abyss",
    };
  },
  getInterpretation(card) {
    return { keywords: card.keywords, meaning: card.meaning };
  },
  summarize: summarizeLenormand,
};

// ---------------------------------------------------------------------------

const DECKS = { tarot: tarotDeck, lenormand: lenormandDeck };

/** A deck through the shared interface, for components that do not care which deck. */
export function getDeck(id: DeckId): Deck {
  return DECKS[id] as unknown as Deck;
}

export function findCard(deckId: DeckId, cardId: string): BaseCard | undefined {
  return getDeck(deckId).cards.find((c) => c.id === cardId);
}

export function cardName(cardId: string): string {
  return (
    findCard("tarot", cardId)?.nameZh ??
    findCard("lenormand", cardId)?.nameZh ??
    cardId
  );
}
