import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { fetchSuggestions, streamFromApi } from "@/lib/api/stream";
import { findReader } from "@/lib/tarot/readers";

import { FollowUpChat } from "./follow-up-chat";

const READING = {
  reader: "fool" as const,
  spread: "daily" as const,
  question: "今天要注意什麼？",
  cards: [{ card_id: "sun" }],
};
const reader = findReader("fool");

describe("FollowUpChat", () => {
  it("US-10 AC1 / US-09 AC1: suggested questions can be tapped to ask", async () => {
    const suggest = vi.fn<typeof fetchSuggestions>(async () => [
      "我該主動一點嗎？",
      "這張怎麼看？",
      "多久會變？",
    ]);
    const stream = vi.fn<typeof streamFromApi>(async (_p, _b, onText) => {
      onText("先別急。");
      return "先別急。";
    });
    const onTurnsChange = vi.fn();
    const onSuggestions = vi.fn();

    render(
      <FollowUpChat
        reader={reader}
        reading={READING}
        aiReading="主要解讀"
        suggest={suggest}
        stream={stream}
        onTurnsChange={onTurnsChange}
        onSuggestions={onSuggestions}
      />,
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "我該主動一點嗎？" }),
    );

    expect(await screen.findByText("先別急。")).toBeInTheDocument();
    expect(stream.mock.calls[0][1]).toEqual({
      ...READING,
      ai_reading: "主要解讀",
      history: [],
      follow_up: "我該主動一點嗎？",
    });
    expect(onTurnsChange).toHaveBeenCalledWith([
      { question: "我該主動一點嗎？", answer: "先別急。" },
    ]);
    expect(onSuggestions).toHaveBeenCalledWith([
      "我該主動一點嗎？",
      "這張怎麼看？",
      "多久會變？",
    ]);
    expect(screen.getByText("還可以追問 4 次")).toBeInTheDocument();
  });

  it("US-10 AC3: saved suggestions are reused without asking the AI", async () => {
    const suggest = vi.fn<typeof fetchSuggestions>();

    render(
      <FollowUpChat
        reader={reader}
        reading={READING}
        aiReading="主要解讀"
        initialSuggestions={["已保存的問題"]}
        suggest={suggest}
      />,
    );

    expect(
      screen.getByRole("button", { name: "已保存的問題" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(suggest).not.toHaveBeenCalled());
  });

  it("US-09 AC2: after 5 follow-ups the input is replaced by a closing note", () => {
    const turns = Array.from({ length: 5 }, (_, i) => ({
      question: `問題${i}`,
      answer: `回答${i}`,
    }));

    render(
      <FollowUpChat
        reader={reader}
        reading={READING}
        aiReading="主要解讀"
        initialTurns={turns}
        initialSuggestions={["不會出現"]}
      />,
    );

    expect(screen.getByText("追問次數已用完")).toBeInTheDocument();
    expect(screen.queryByLabelText("輸入追問")).toBeNull();
    expect(screen.queryByRole("button", { name: "不會出現" })).toBeNull();
    expect(screen.getByText("回答4")).toBeInTheDocument();
  });
});
