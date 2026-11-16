import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { findCard, tarotDeck, type TarotCard } from "@/lib/tarot/decks";

import { CardFace } from "./card-face";

const card = (id: string) => findCard("tarot", id) as TarotCard;

describe("CardFace", () => {
  it("US-16 AC1 / US-18 AC1: illustrated cards show the WebP art and the Chinese name", () => {
    const star = card("star");
    render(
      <CardFace card={star} face={tarotDeck.getFaceInfo(star)} sizes="105px" />,
    );

    const face = screen.getByTestId("card-face");
    const img = within(face).getByRole("img", { name: "星星" });
    expect(img.getAttribute("src")).toContain("star.webp");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("sizes", "105px");
    expect(within(face).getByText("星星")).toBeInTheDocument();
  });

  it("US-20 AC1: cards without art show a text card", () => {
    const ace = card("ace-of-cups");
    render(<CardFace card={ace} face={tarotDeck.getFaceInfo(ace)} />);

    const face = screen.getByTestId("card-face");
    expect(within(face).queryByRole("img")).toBeNull();
    expect(within(face).getByText("聖杯王牌")).toBeInTheDocument();
    expect(within(face).getByText("Ace of Cups")).toBeInTheDocument();
  });

  it("US-05 AC2: a reversed card turns the whole face 180 degrees", () => {
    const fool = card("fool");
    render(
      <CardFace card={fool} face={tarotDeck.getFaceInfo(fool)} reversed />,
    );

    const inner = screen.getByTestId("card-face").firstElementChild;
    expect(inner).toHaveClass("rotate-180");
  });
});
