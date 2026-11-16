import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const del = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("@/lib/api/browser", () => ({
  createBrowserApiClient: () => ({ DELETE: del }),
}));

import { DeleteReadingButton } from "./delete-reading-button";

describe("DeleteReadingButton", () => {
  beforeEach(() => {
    del.mockReset();
    refresh.mockReset();
    del.mockResolvedValue({ error: undefined });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("US-30 AC1: deletes the reading after confirming", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<DeleteReadingButton readingId="reading-1" />);

    await userEvent.click(screen.getByRole("button", { name: "刪除" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(del).toHaveBeenCalledWith("/api/v1/readings/{reading_id}", {
      params: { path: { reading_id: "reading-1" } },
    });
  });

  it("US-30 AC2: does nothing when the confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DeleteReadingButton readingId="reading-1" />);

    await userEvent.click(screen.getByRole("button", { name: "刪除" }));

    expect(del).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
