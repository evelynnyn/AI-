import { beforeEach, describe, expect, it } from "vitest";

import { localStore, STORAGE_KEY } from "./local-store";

const DAILY = {
  question: "今天要注意什麼？",
  spread: "daily" as const,
  reader: "fool" as const,
  cards: [{ position: "today", card_id: "sun", reversed: true }],
};

describe("localStore (guests)", () => {
  beforeEach(() => localStorage.clear());

  it("US-13 AC10: a guest's reading is saved in this browser, newest first", async () => {
    const first = await localStore.create(DAILY);
    const second = await localStore.create({ ...DAILY, question: "第二次" });

    const list = await localStore.list();

    expect(list.map((r) => r.id)).toEqual([second.id, first.id]);
    expect(list[1]).toMatchObject({
      question: "今天要注意什麼？",
      spread: "daily",
      reader: "fool",
      cards: [{ position: "today", card_id: "sun", reversed: true }],
      interpretation: null,
      follow_ups: [],
    });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toHaveLength(2);
  });

  it("US-14 AC1: the AI reading, suggestions and follow-ups are written back", async () => {
    const { id } = await localStore.create(DAILY);

    await localStore.update(id, { interpretation: "太陽說……" });
    await localStore.update(id, {
      suggestions: ["一", "二", "三"],
      follow_ups: [{ question: "然後呢？", answer: "慢慢來。" }],
    });

    const [saved] = await localStore.list();
    expect(saved.interpretation).toBe("太陽說……");
    expect(saved.suggestions).toEqual(["一", "二", "三"]);
    expect(saved.follow_ups).toEqual([
      { question: "然後呢？", answer: "慢慢來。" },
    ]);
  });

  it("US-30 AC6: deleting removes the guest's reading", async () => {
    const { id } = await localStore.create(DAILY);

    await localStore.remove(id);

    expect(await localStore.list()).toEqual([]);
  });

  it("US-13 AC10: broken stored data reads as no readings", async () => {
    localStorage.setItem(STORAGE_KEY, "{not json");

    expect(await localStore.list()).toEqual([]);
  });
});
