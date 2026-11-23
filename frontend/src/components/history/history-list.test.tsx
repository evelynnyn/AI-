import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReadingStore, SavedReading } from "@/lib/history/types";

import { HistoryList } from "./history-list";

const READING: SavedReading = {
  id: "7d0f5c0e-0000-4000-8000-000000000001",
  created_at: "2026-11-20T08:00:00Z",
  question: "這個月的工作運勢如何？",
  spread: "daily",
  reader: "fool",
  cards: [{ position: "today", card_id: "sun", reversed: false }],
  interpretation: null,
  suggestions: [],
  follow_ups: [],
};

function fakeStore(): ReadingStore {
  return {
    kind: "cloud",
    list: vi.fn(async () => [READING]),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(async () => {}),
  };
}

async function openReading() {
  await userEvent.click(
    await screen.findByRole("button", { name: /這個月的工作運勢如何？/ }),
  );
}

describe("HistoryList", () => {
  afterEach(() => vi.restoreAllMocks());

  it("US-30 AC1: confirming the dialog deletes the reading", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const store = fakeStore();
    render(<HistoryList store={store} />);

    await openReading();
    await userEvent.click(screen.getByRole("button", { name: "刪除這筆紀錄" }));

    expect(window.confirm).toHaveBeenCalledWith("確認要刪除這筆占卜紀錄嗎？");
    expect(store.remove).toHaveBeenCalledWith(READING.id);
    expect(
      await screen.findByText("還沒有占卜紀錄，先來抽第一次牌吧！"),
    ).toBeInTheDocument();
  });

  it("US-30 AC2: cancelling the dialog keeps the reading and calls nothing", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const store = fakeStore();
    render(<HistoryList store={store} />);

    await openReading();
    await userEvent.click(screen.getByRole("button", { name: "刪除這筆紀錄" }));

    expect(store.remove).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /這個月的工作運勢如何？/ }),
    ).toBeInTheDocument();
  });
});
