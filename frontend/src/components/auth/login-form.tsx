"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export const credentialsSchema = z.object({
  email: z.email("請輸入有效的電子郵件"),
  password: z.string().min(8, "密碼至少需要 8 個字元"),
});

type Credentials = z.infer<typeof credentialsSchema>;
type Mode = "sign-in" | "sign-up";

const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "電子郵件或密碼不正確",
  user_already_exists: "這個電子郵件已經註冊過，請直接登入",
  email_not_confirmed: "請先到信箱點擊確認連結，再登入",
  weak_password: "密碼強度不足，請換一個更長的密碼",
};

export function LoginForm({
  next,
  callbackFailed,
}: {
  next: string;
  callbackFailed: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState<string | null>(
    callbackFailed ? "登入連結已失效，請再試一次" : null,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({ resolver: zodResolver(credentialsSchema) });

  const callbackUrl = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function onSubmit({ email, password }: Credentials) {
    setError(null);
    setNotice(null);
    const supabase = createClient();
    const redirectTo = callbackUrl();

    const { data, error: authError } =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: redirectTo },
          });

    if (authError) {
      setError(AUTH_ERRORS[authError.code ?? ""] ?? "登入失敗，請稍後再試一次");
      return;
    }
    if (!data.session) {
      setNotice("註冊成功！請到信箱點擊確認連結，完成後即可登入。");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function signInWithGoogle() {
    setError(null);
    const { error: authError } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (authError) setError("無法使用 Google 登入，請改用電子郵件登入");
  }

  const isSignIn = mode === "sign-in";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">
          {isSignIn ? "登入星語塔羅" : "建立帳號"}
        </CardTitle>
        <CardDescription>
          登入後，每次占卜都會自動保存，方便之後回顧。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {notice && (
          <Alert>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">電子郵件</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-destructive text-sm">{errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">密碼</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignIn ? "current-password" : "new-password"}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-destructive text-sm">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "處理中…" : isSignIn ? "登入" : "註冊"}
          </Button>
        </form>

        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span className="bg-border h-px flex-1" />或
          <span className="bg-border h-px flex-1" />
        </div>
        <Button variant="outline" onClick={signInWithGoogle}>
          使用 Google 帳號登入
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          {isSignIn ? "還沒有帳號？" : "已經有帳號了？"}
          <Button
            variant="link"
            className="h-auto px-1"
            onClick={() => {
              setMode(isSignIn ? "sign-up" : "sign-in");
              setError(null);
              setNotice(null);
            }}
          >
            {isSignIn ? "建立帳號" : "登入"}
          </Button>
        </p>
      </CardContent>
    </Card>
  );
}
