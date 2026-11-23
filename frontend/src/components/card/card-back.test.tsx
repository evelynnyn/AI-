import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CardBack } from "./card-back";
import { CardBackSprite } from "./card-back-sprite";

describe("CardBack", () => {
  it("US-18 AC2: every card back points at the one shared SVG symbol", () => {
    const { container } = render(
      <>
        <CardBackSprite />
        <CardBack />
        <CardBack />
      </>,
    );

    expect(container.querySelectorAll("symbol#card-back")).toHaveLength(1);
    const uses = container.querySelectorAll("use");
    expect(uses).toHaveLength(2);
    uses.forEach((u) => expect(u).toHaveAttribute("href", "#card-back"));
  });
});
