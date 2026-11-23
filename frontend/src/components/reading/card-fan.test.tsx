import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { CardFan } from "./card-fan";

beforeAll(() => {
  // jsdom has no layout: report a phone-sized width so the fan renders its cards.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private cb: ResizeObserverCallback) {}
      observe() {
        this.cb(
          [{ contentRect: { width: 390 } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }
      disconnect() {}
    },
  );
});

describe("CardFan", () => {
  it("US-04 AC2: tapping a card picks it; a picked card is hidden from the fan", async () => {
    const onPick = vi.fn();
    const { rerender } = render(
      <CardFan
        count={78}
        picked={new Set()}
        disabled={false}
        onPick={onPick}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "抽第 5 張牌" }));
    expect(onPick).toHaveBeenCalledWith(4, expect.any(Object));

    rerender(
      <CardFan
        count={78}
        picked={new Set([4])}
        disabled={false}
        onPick={onPick}
      />,
    );
    expect(screen.getByRole("button", { name: "抽第 5 張牌" })).toHaveStyle({
      opacity: "0",
    });
  });

  it("US-04 AC3: once the spread is full, tapping the fan draws nothing", async () => {
    const onPick = vi.fn();
    render(
      <CardFan
        count={36}
        picked={new Set([0, 1, 2])}
        disabled
        onPick={onPick}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "抽第 10 張牌" }));

    expect(onPick).not.toHaveBeenCalled();
  });

  it("US-04 AC5: a card that was already drawn cannot be drawn again", () => {
    const onPick = vi.fn();
    render(
      <CardFan
        count={78}
        picked={new Set([4])}
        disabled={false}
        onPick={onPick}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "抽第 5 張牌" }));
    expect(onPick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "抽第 6 張牌" }));
    expect(onPick).toHaveBeenCalledWith(5, expect.any(Object));
  });

  it("US-18 AC3: the 78-card fan downloads no images; every back reuses one symbol", () => {
    const { container } = render(
      <CardFan
        count={78}
        picked={new Set()}
        disabled={false}
        onPick={vi.fn()}
      />,
    );

    expect(container.querySelectorAll("img")).toHaveLength(0);
    const uses = container.querySelectorAll("use");
    expect(uses).toHaveLength(78);
    uses.forEach((u) => expect(u).toHaveAttribute("href", "#card-back"));
  });
});
