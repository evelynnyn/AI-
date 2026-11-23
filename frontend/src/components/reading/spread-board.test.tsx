import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { findCard, tarotDeck, type TarotCard } from "@/lib/tarot/decks";
import { SPREADS } from "@/lib/tarot/spreads";

import { SpreadBoard, type SlotCard } from "./spread-board";

const slot = (id: string): SlotCard => {
  const card = findCard("tarot", id) as TarotCard;
  return { card, face: tarotDeck.getFaceInfo(card), reversed: false };
};
const THREE = SPREADS.three;
const CARDS = [slot("fool"), slot("sun"), slot("moon")];

function board(props: { canFlip: boolean; flipped: boolean[] }) {
  const onFlip = vi.fn();
  render(
    <SpreadBoard
      positions={THREE.positions}
      cards={CARDS}
      placed={[true, true, true]}
      deckHasReversed
      slotRefs={{ current: [] }}
      onFlip={onFlip}
      {...props}
    />,
  );
  return onFlip;
}

describe("SpreadBoard", () => {
  it("US-05 AC4: cards cannot be flipped before every card has landed", () => {
    const onFlip = board({ canFlip: false, flipped: [false, false, false] });

    const cards = screen.getAllByRole("button", { name: "翻開這張牌" });
    expect(cards).toHaveLength(3);
    cards.forEach((c) => expect(c).toBeDisabled());
    fireEvent.click(cards[0]);
    expect(onFlip).not.toHaveBeenCalled();
  });

  it("US-05 AC5: a card that is face up stays face up when tapped again", () => {
    const onFlip = board({ canFlip: true, flipped: [true, false, false] });

    const fool = screen.getByRole("button", { name: "愚者（正位）" });
    expect(fool).toBeDisabled();
    fireEvent.click(fool);
    expect(onFlip).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "翻開這張牌" })[0]);
    expect(onFlip).toHaveBeenCalledWith(1);
  });
});
