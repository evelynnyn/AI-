import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// backend/app/catalog is the source of truth; these files are display copies.
const BACKEND = join(process.cwd(), "..", "backend", "app", "catalog");
const FRONTEND = join(process.cwd(), "src", "data", "catalog");

describe("catalog copies", () => {
  it.each(["tarot_cards.json", "lenormand_cards.json", "spreads.json"])(
    "SEC-03 AC1: %s matches the backend catalog",
    (file) => {
      expect(readFileSync(join(FRONTEND, file), "utf8")).toBe(
        readFileSync(join(BACKEND, file), "utf8"),
      );
    },
  );
});
