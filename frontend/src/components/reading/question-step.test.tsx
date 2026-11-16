import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ReaderId } from "@/lib/tarot/readers";
import { SPREADS } from "@/lib/tarot/spreads";

import { QuestionStep } from "./question-step";

function Harness({ onSubmit }: { onSubmit: () => void }) {
  const [question, setQuestion] = useState("");
  const [reader, setReader] = useState<ReaderId>("high-priestess");
  return (
    <QuestionStep
      spread={SPREADS.three}
      question={question}
      onChange={setQuestion}
      readerId={reader}
      onReaderChange={setReader}
      onSubmit={onSubmit}
    />
  );
}

describe("QuestionStep", () => {
  it("US-02 AC1: shows the question length out of 200", async () => {
    render(<Harness onSubmit={vi.fn()} />);
    expect(screen.getByText("0 / 200")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("你想問什麼？"), "工作運勢");

    expect(screen.getByText("4 / 200")).toBeInTheDocument();
  });

  it("US-02 AC5: tapping one of 3 examples fills in the question", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const examples = SPREADS.three.examples;
    expect(examples).toHaveLength(3);

    await userEvent.click(screen.getByRole("button", { name: examples[1] }));
    await userEvent.click(screen.getByRole("button", { name: "開始洗牌" }));

    expect(screen.getByLabelText("你想問什麼？")).toHaveValue(examples[1]);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("US-02 AC3: a blank question cannot start the reading", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("你想問什麼？"), "   ");
    await userEvent.click(screen.getByRole("button", { name: "開始洗牌" }));

    expect(screen.getByText("請輸入想問的問題")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("US-07 AC2 / AC4: three readers with intros, High Priestess chosen by default", async () => {
    render(<Harness onSubmit={vi.fn()} />);
    const readers = screen.getAllByRole("radio");

    expect(readers).toHaveLength(3);
    expect(screen.getByRole("radio", { name: /女祭司/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(
      screen.getByText("直白犀利、重點先講，把牌義變成你今天就能做的行動。"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: /魔術師/ }));
    expect(screen.getByRole("radio", { name: /魔術師/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
