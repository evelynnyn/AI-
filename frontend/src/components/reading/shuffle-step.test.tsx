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
    expect(screen.getByRole("button", { name: "停止洗牌" })).toBeEnabled();
  });

  it("US-03 AC2: 停止洗牌 turns into a disabled 洗牌完成, then moves on to picking", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<ShuffleStep onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: "停止洗牌" }));
    expect(screen.getByRole("button", { name: "洗牌完成" })).toBeDisabled();

    act(() => vi.advanceTimersByTime(700));
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("US-03 AC3: pressing again after stopping does not gather the cards twice", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<ShuffleStep onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: "停止洗牌" }));
    fireEvent.click(screen.getByRole("button", { name: "洗牌完成" }));
    act(() => vi.advanceTimersByTime(5_000));

    expect(onDone).toHaveBeenCalledOnce();
  });

  it("US-03 AC4: stopping right away still waits for the cards to gather", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<ShuffleStep onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: "停止洗牌" }));
    act(() => vi.advanceTimersByTime(699));
    expect(onDone).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onDone).toHaveBeenCalledOnce();
  });
});
