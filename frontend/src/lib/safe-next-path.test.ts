import { describe, expect, it } from "vitest";

import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("US-29 AC7: keeps paths on this site", () => {
    expect(safeNextPath("/readings?x=1")).toBe("/readings?x=1");
  });

  it.each([
    null,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
  ])("US-29 AC7: falls back to /readings for %s", (value) => {
    expect(safeNextPath(value)).toBe("/readings");
  });
});
