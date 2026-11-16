import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ShuffleStep } from "./shuffle-step";

describe("ShuffleStep", () => {
  afterEach(() => vi.useRealTimers());

  it("US-03 AC1: shuffling keeps going until 停止洗牌 is pressed", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<ShuffleStep onDone={onDone} />);

    act(() => vi.advanceTimersByTime(10_000));
    expect(onDone).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "停止洗牌" }));
    expect(screen.getByRole("button", { name: "洗牌完成" })).toBeDisabled();

    act(() => vi.advanceTimersByTime(700));
    expect(onDone).toHaveBeenCalledOnce();
  });
});
