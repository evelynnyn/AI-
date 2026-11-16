import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();
const signUp = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: vi.fn() }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithPassword, signUp } }),
}));

import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    signUp.mockReset();
    replace.mockReset();
  });

  it("US-29 AC4: shows validation messages in Traditional Chinese", async () => {
    render(<LoginForm next="/readings" callbackFailed={false} />);

    await userEvent.click(screen.getByRole("button", { name: "登入" }));

    expect(await screen.findByText("請輸入有效的電子郵件")).toBeInTheDocument();
    expect(screen.getByText("密碼至少需要 8 個字元")).toBeInTheDocument();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("US-29 AC2: signs in and goes to the requested page", async () => {
    signInWithPassword.mockResolvedValue({
      data: { session: {} },
      error: null,
    });
    render(<LoginForm next="/readings" callbackFailed={false} />);

    await userEvent.type(
      screen.getByLabelText("電子郵件"),
      "tarot@example.com",
    );
    await userEvent.type(screen.getByLabelText("密碼"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "登入" }));

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "tarot@example.com",
      password: "password123",
    });
    expect(replace).toHaveBeenCalledWith("/readings");
  });

  it("US-29 AC5: explains wrong credentials", async () => {
    signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { code: "invalid_credentials" },
    });
    render(<LoginForm next="/readings" callbackFailed={false} />);

    await userEvent.type(
      screen.getByLabelText("電子郵件"),
      "tarot@example.com",
    );
    await userEvent.type(screen.getByLabelText("密碼"), "wrongpass1");
    await userEvent.click(screen.getByRole("button", { name: "登入" }));

    expect(await screen.findByText("電子郵件或密碼不正確")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("US-29 AC6: tells an existing user to sign in instead of signing up again", async () => {
    signUp.mockResolvedValue({
      data: { session: null },
      error: { code: "user_already_exists" },
    });
    render(<LoginForm next="/readings" callbackFailed={false} />);

    await userEvent.click(screen.getByRole("button", { name: "建立帳號" }));
    await userEvent.type(
      screen.getByLabelText("電子郵件"),
      "tarot@example.com",
    );
    await userEvent.type(screen.getByLabelText("密碼"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "註冊" }));

    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "tarot@example.com",
        password: "password123",
      }),
    );
    expect(
      await screen.findByText("這個電子郵件已經註冊過，請直接登入"),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
