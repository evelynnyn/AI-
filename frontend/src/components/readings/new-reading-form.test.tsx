import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/lib/api/browser", () => ({
  createBrowserApiClient: () => ({ POST: post }),
}));

import { NewReadingForm } from "./new-reading-form";

describe("NewReadingForm", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ data: {}, error: undefined });
  });

  it("US-02 AC1: shows the question length out of 200", async () => {
    render(<NewReadingForm />);
    expect(screen.getByText("0 / 200")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("你想問什麼？"), "工作運勢");

    expect(screen.getByText("4 / 200")).toBeInTheDocument();
  });

  it("US-02 AC3: blocks a blank question without calling the API", async () => {
    render(<NewReadingForm />);

    await userEvent.type(screen.getByLabelText("你想問什麼？"), "   ");
    await userEvent.click(screen.getByRole("button", { name: "抽牌並保存" }));

    expect(await screen.findByText("請輸入想問的問題")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("US-13 AC1: saves the question, spread, reader and drawn cards", async () => {
    render(<NewReadingForm />);

    await userEvent.type(screen.getByLabelText("你想問什麼？"), "今天的提醒");
    await userEvent.selectOptions(screen.getByLabelText("牌陣"), "daily");
    await userEvent.selectOptions(screen.getByLabelText("解讀師"), "fool");
    await userEvent.click(screen.getByRole("button", { name: "抽牌並保存" }));

    expect(post).toHaveBeenCalledTimes(1);
    const [path, { body }] = post.mock.calls[0];
    expect(path).toBe("/api/v1/readings");
    expect(body).toMatchObject({
      question: "今天的提醒",
      spread: "daily",
      reader: "fool",
    });
    expect(body.cards).toHaveLength(1);
    expect(body.cards[0].position).toBe("today");
  });
});
