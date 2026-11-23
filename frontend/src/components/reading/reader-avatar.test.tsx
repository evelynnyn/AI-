import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { findReader } from "@/lib/tarot/readers";

import { ReaderAvatar } from "./reader-avatar";

describe("ReaderAvatar", () => {
  it("US-07 AC5: a missing avatar image falls back to the gold placeholder", () => {
    render(<ReaderAvatar reader={findReader("fool")} />);

    const img = screen.getByRole("img", { name: "愚者" });
    expect(screen.queryByTestId("avatar-placeholder")).toBeNull();

    fireEvent.error(img);

    expect(screen.getByTestId("avatar-placeholder")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "愚者" })).toBeNull();
  });
});
