import { describe, expect, it, vi } from "vitest";

import { fetchSuggestions, StreamError, streamFromApi } from "./stream";

const BODY = {
  spread: "daily" as const,
  question: "今天要注意什麼？",
  cards: [{ card_id: "sun" }],
};

/** A fake fetch that answers with these NDJSON lines. */
function ndjson(lines: object[], status = 200) {
  return vi.fn(async (request: Request) => {
    void request;
    const text = lines.map((l) => JSON.stringify(l)).join("\n") + "\n";
    return new Response(text, {
      status,
      headers: { "Content-Type": "application/x-ndjson" },
    });
  });
}

describe("streamFromApi", () => {
  it("US-08 AC1: passes each piece on and returns the whole reading", async () => {
    const fetchImpl = ndjson([
      { t: "你好" },
      { t: "，我看到了" },
      { done: true },
    ]);
    const pieces: string[] = [];

    const full = await streamFromApi(
      "/api/v1/ai/reading",
      BODY,
      (t) => pieces.push(t),
      { fetchImpl },
    );

    expect(pieces).toEqual(["你好", "，我看到了"]);
    expect(full).toBe("你好，我看到了");
    const request = fetchImpl.mock.calls[0][0];
    expect(request.url).toMatch(/\/api\/v1\/ai\/reading$/);
    expect(await request.json()).toEqual(BODY);
  });

  it("US-12 AC1: an error after some text keeps the text and throws the message", async () => {
    const fetchImpl = ndjson([
      { t: "第一張牌" },
      { error: "與解讀師的連線中斷了，請稍後再試一次。" },
    ]);
    const pieces: string[] = [];

    const promise = streamFromApi(
      "/api/v1/ai/reading",
      BODY,
      (t) => pieces.push(t),
      { fetchImpl },
    );

    await expect(promise).rejects.toThrow("與解讀師的連線中斷了");
    expect(pieces).toEqual(["第一張牌"]);
  });

  it("US-12 AC1: a stream that ends without done counts as cut off", async () => {
    const fetchImpl = ndjson([{ t: "到一半" }]);

    await expect(
      streamFromApi("/api/v1/ai/reading", BODY, () => {}, { fetchImpl }),
    ).rejects.toThrow("與解讀師的連線中斷了，請再試一次。");
  });

  it("SEC-01 AC4: a crisis line raises a StreamError marked as crisis", async () => {
    const fetchImpl = ndjson([
      { error: "謝謝你願意說出心裡的感受。", crisis: true },
    ]);

    const error = await streamFromApi("/api/v1/ai/reading", BODY, () => {}, {
      fetchImpl,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(StreamError);
    expect((error as StreamError).crisis).toBe(true);
  });

  it("US-08 AC4: a 400 from the server shows its detail", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ detail: "此牌陣需要 3 張牌" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
    );

    await expect(
      streamFromApi("/api/v1/ai/reading", BODY, () => {}, { fetchImpl }),
    ).rejects.toThrow("此牌陣需要 3 張牌");
  });
});

describe("fetchSuggestions", () => {
  it("US-10 AC1: returns the three suggested questions", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ suggestions: ["一", "二", "三"], generated: true }),
          { headers: { "Content-Type": "application/json" } },
        ),
    );

    expect(
      await fetchSuggestions({ ...BODY, ai_reading: "解讀" }, fetchImpl),
    ).toEqual(["一", "二", "三"]);
  });
});
