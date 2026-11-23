import { describe, expect, it } from "vitest";

import {
  cardName,
  findCard,
  lenormandDeck,
  tarotDeck,
  type LenormandCard,
  type ReadingItem,
  type TarotCard,
} from "./decks";
import { SPREADS } from "./spreads";

const tarot = (id: string) => findCard("tarot", id) as TarotCard;
const lenormand = (id: string) => findCard("lenormand", id) as LenormandCard;

describe("tarot deck", () => {
  it("US-06 AC1: meaning and keywords follow the orientation", () => {
    const fool = tarot("fool");

    expect(tarotDeck.getInterpretation(fool, "upright").keywords).toEqual(
      fool.uprightKeywords,
    );
    expect(tarotDeck.getInterpretation(fool, "reversed").meaning).toBe(
      fool.reversedMeaning,
    );
  });

  it("US-16 AC1: all 22 major arcana have illustrations", () => {
    const majors = tarotDeck.cards.filter((c) => c.arcana === "major");

    expect(majors).toHaveLength(22);
    expect(majors.every((c) => c.image?.endsWith(".webp"))).toBe(true);
  });

  it("US-20 AC1: cards without art get a text face with a corner label", () => {
    const ace = tarot("ace-of-cups");

    expect(ace.image).toBeNull();
    expect(tarotDeck.getFaceInfo(ace).label).toBe("A");
    expect(tarotDeck.getFaceInfo(tarot("star")).label).toBe("XVII");
  });

  it("US-06 AC2 / US-08 AC8: three-card summary tells the past, present and future story", () => {
    const positions = SPREADS.three.positions;
    const items: ReadingItem<TarotCard>[] = [
      { card: tarot("fool"), orientation: "upright", position: positions[0] },
      { card: tarot("tower"), orientation: "reversed", position: positions[1] },
      { card: tarot("star"), orientation: "upright", position: positions[2] },
    ];

    const [story, energy, advice] = tarotDeck.summarize(items);

    expect(story).toContain("回顧過去，「愚者」");
    expect(story).toContain("「高塔」逆位");
    expect(energy).toContain("3 張牌中有 3 張大阿爾克那");
    expect(advice).toContain("最後一張「星星」是正位");
  });
});

describe("Lenormand deck", () => {
  it("US-08 AC9: three-card line reads like a sentence", () => {
    const positions = SPREADS["lenormand-three"].positions;
    const items = ["rider", "clover", "ship"].map((id, i) => ({
      card: lenormand(id),
      orientation: "upright" as const,
      position: positions[i],
    }));

    const [sentence, core] = lenormandDeck.summarize(items);

    expect(sentence).toContain("以「騎士」");
    expect(core).toContain("中間的「幸運草」是整件事的重心");
  });

  it("US-08 AC9: nine-box summary starts from the centre card", () => {
    const positions = SPREADS["lenormand-nine"].positions;
    const items = lenormandDeck.cards.slice(0, 9).map((card, i) => ({
      card,
      orientation: "upright" as const,
      position: positions[i],
    }));

    expect(lenormandDeck.summarize(items)[0]).toContain(
      `九宮格的核心是「${items[4].card.nameZh}」`,
    );
  });

  it("US-13 AC1: card ids map to Traditional Chinese names", () => {
    expect(cardName("world")).toBe("世界");
    expect(cardName("five-of-cups")).toBe("聖杯五");
    expect(cardName("rider")).toBe("騎士");
  });
});
