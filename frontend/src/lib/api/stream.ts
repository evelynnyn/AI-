import { createApiClient } from "./client";
import type { components } from "./types";

export type AiReadingRequest = components["schemas"]["AiReadingRequest"];
export type FollowUpRequest = components["schemas"]["FollowUpRequest"];
export type SuggestionsRequest = components["schemas"]["SuggestionsRequest"];

/** The stream failed; `crisis` means show helplines and no retry (SEC-01). */
export class StreamError extends Error {
  constructor(
    message: string,
    public crisis = false,
  ) {
    super(message);
    this.name = "StreamError";
  }
}

/** Pause before the reader starts talking ("正在看牌……"); overlaps the AI's own wait. */
export const THINKING_PAUSE_MS = 1500;

const DEFAULT_ERROR = "解讀師暫時沒有回應，請稍後再試一次。";

type FetchImpl = (input: Request) => Promise<Response>;

/** AI endpoints are open to guests, so no token is attached. */
const aiClient = () => createApiClient(async () => undefined);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Read an NDJSON stream from the AI endpoints (format in backend/app/services/ai.py).
 * Calls onText for each piece, returns the full text, and throws StreamError with a
 * friendly message on failure; text already shown stays on screen (US-12).
 */
export async function streamFromApi(
  path: "/api/v1/ai/reading" | "/api/v1/ai/follow-up",
  body: AiReadingRequest | FollowUpRequest,
  onText: (chunk: string) => void,
  {
    signal,
    minDelayMs = 0,
    fetchImpl,
  }: { signal?: AbortSignal; minDelayMs?: number; fetchImpl?: FetchImpl } = {},
): Promise<string> {
  const api = aiClient();
  const options = { parseAs: "stream" as const, signal, fetch: fetchImpl };
  let result;
  try {
    [result] = await Promise.all([
      path === "/api/v1/ai/reading"
        ? api.POST(path, { ...options, body: body as AiReadingRequest })
        : api.POST(path, { ...options, body: body as FollowUpRequest }),
      sleep(minDelayMs),
    ]);
  } catch {
    throw new StreamError("網路連線不穩定，請確認連線後再試一次。");
  }

  const { response, error } = result;
  if (!response.ok || !response.body) {
    const detail = (error as { detail?: unknown } | undefined)?.detail;
    throw new StreamError(typeof detail === "string" ? detail : DEFAULT_ERROR);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let finished = false;

  const handleLine = (line: string) => {
    if (!line.trim()) return;
    const data = JSON.parse(line) as {
      t?: string;
      done?: boolean;
      error?: string;
      crisis?: boolean;
    };
    if (data.error) throw new StreamError(data.error, data.crisis === true);
    if (data.t) {
      full += data.t;
      onText(data.t);
    }
    if (data.done) finished = true;
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(handleLine);
  }
  handleLine(buffer);

  if (!finished) throw new StreamError("與解讀師的連線中斷了，請再試一次。");
  return full;
}

/** Three suggested follow-ups; generic ones when the AI fails (US-10). */
export async function fetchSuggestions(
  body: SuggestionsRequest,
  fetchImpl?: FetchImpl,
): Promise<string[]> {
  const { data } = await aiClient().POST("/api/v1/ai/follow-up/suggestions", {
    body,
    fetch: fetchImpl,
  });
  return data?.suggestions ?? [];
}
