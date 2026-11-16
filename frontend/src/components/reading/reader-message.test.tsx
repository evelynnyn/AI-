import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StreamError, type streamFromApi } from "@/lib/api/stream";
import { findReader } from "@/lib/tarot/readers";

import { ReaderMessage } from "./reader-message";

const REQUEST = {
  reader: "high-priestess" as const,
  spread: "daily" as const,
  question: "今天要注意什麼？",
  cards: [{ card_id: "sun", reversed: false }],
};
const reader = findReader("magician");

type Stream = typeof streamFromApi;

describe("ReaderMessage", () => {
  it("US-08 AC1 / US-11 AC3: shows the streamed reading and marks it as AI", async () => {
    const stream = vi.fn<Stream>(async (_path, _body, onText) => {
      onText("你看，");
      onText("太陽高掛。");
      return "你看，太陽高掛。";
    });
    const onComplete = vi.fn();

    render(
      <ReaderMessage
        reader={reader}
        request={REQUEST}
        autoStart
        onComplete={onComplete}
        stream={stream}
      />,
    );

    expect(await screen.findByText("你看，太陽高掛。")).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledWith("你看，太陽高掛。");
    expect(screen.getByText("解讀由 AI 產生")).toBeInTheDocument();
    expect(stream.mock.calls[0][0]).toBe("/api/v1/ai/reading");
    expect(stream.mock.calls[0][1]).toEqual(REQUEST);
  });

  it("US-12 AC1: keeps the text so far and offers 再試一次", async () => {
    const stream = vi
      .fn<Stream>()
      .mockImplementationOnce(async (_p, _b, onText) => {
        onText("第一張牌");
        throw new StreamError("與解讀師的連線中斷了，請稍後再試一次。");
      })
      .mockImplementationOnce(async (_p, _b, onText) => {
        onText("重新說一次");
        return "重新說一次";
      });

    render(
      <ReaderMessage
        reader={reader}
        request={REQUEST}
        autoStart
        stream={stream}
      />,
    );

    expect(await screen.findByText("第一張牌")).toBeInTheDocument();
    expect(
      screen.getByText("與解讀師的連線中斷了，請稍後再試一次。"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "再試一次" }));

    expect(await screen.findByText("重新說一次")).toBeInTheDocument();
    expect(stream).toHaveBeenCalledTimes(2);
  });

  it("SEC-01 AC4: a crisis shows tappable helplines and no retry", async () => {
    const stream = vi.fn<Stream>(async () => {
      throw new StreamError("謝謝你願意說出心裡的感受。", true);
    });

    render(
      <ReaderMessage
        reader={reader}
        request={REQUEST}
        autoStart
        stream={stream}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "謝謝你願意說出心裡的感受。",
    );
    expect(screen.getByRole("link", { name: "1925" })).toHaveAttribute(
      "href",
      "tel:1925",
    );
    expect(screen.getByRole("link", { name: "119／110" })).toHaveAttribute(
      "href",
      "tel:119",
    );
    expect(screen.queryByRole("button", { name: "再試一次" })).toBeNull();
  });

  it("US-14 AC4: a saved reading is shown without calling the AI again", async () => {
    const stream = vi.fn<Stream>();

    render(
      <ReaderMessage
        reader={reader}
        request={REQUEST}
        initialText="已保存的解讀"
        autoStart
        stream={stream}
      />,
    );

    expect(screen.getByText("已保存的解讀")).toBeInTheDocument();
    await waitFor(() => expect(stream).not.toHaveBeenCalled());
  });

  it("US-15 AC1: a reading with no saved text can be requested again", async () => {
    const stream = vi.fn<Stream>(async (_p, _b, onText) => {
      onText("補上的解讀");
      return "補上的解讀";
    });

    render(<ReaderMessage reader={reader} request={REQUEST} stream={stream} />);
    await userEvent.click(
      screen.getByRole("button", { name: "請魔術師為我解讀" }),
    );

    expect(await screen.findByText("補上的解讀")).toBeInTheDocument();
  });
});
