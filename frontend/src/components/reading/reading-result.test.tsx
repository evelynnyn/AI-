import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { findCard } from "@/lib/tarot/decks";
import { SPREADS } from "@/lib/tarot/spreads";

import { ReadingResult } from "./reading-result";

const NINE_IDS = [
  "rider",
  "clover",
  "ship",
  "house",
  "tree",
  "clouds",
  "snake",
  "coffin",
  "bouquet",
];

describe("ReadingResult", () => {
  it("US-06 AC3: Lenormand cards show no upright or reversed label", () => {
    render(
      <ReadingResult
        spread={SPREADS["lenormand-three"]}
        question="這週的人際關係？"
        cards={[
          { position: "start", card_id: "rider", reversed: false },
          { position: "core", card_id: "clover", reversed: false },
          { position: "outcome", card_id: "ship", reversed: false },
        ]}
        createdAt="2026-11-20T08:00:00Z"
      />,
    );

    for (const id of ["rider", "clover", "ship"]) {
      const name = findCard("lenormand", id)!.nameZh;
      expect(
        screen.getByRole("heading", { level: 3, name: new RegExp(name) }),
      ).toBeInTheDocument();
    }
    expect(screen.queryByText("正位")).toBeNull();
    expect(screen.queryByText("逆位")).toBeNull();
  });

  it("US-06 AC4: a nine-box reading lists all 9 cards in position order", () => {
    const spread = SPREADS["lenormand-nine"];
    render(
      <ReadingResult
        spread={spread}
        question="接下來三個月的方向？"
        cards={NINE_IDS.map((card_id, i) => ({
          position: spread.positions[i].id,
          card_id,
          reversed: false,
        }))}
        createdAt="2026-11-20T08:00:00Z"
      />,
    );

    const items = screen
      .getAllByRole("listitem")
      .filter((li) => li.querySelector("[data-testid=card-face]"));
    expect(items).toHaveLength(9);
    items.forEach((li, i) =>
      expect(
        within(li).getByText(spread.positions[i].label),
      ).toBeInTheDocument(),
    );
  });
});
