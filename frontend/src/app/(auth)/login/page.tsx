import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/safe-next-path";

export const metadata = { title: "登入｜星語塔羅" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-12">
      <LoginForm
        next={safeNextPath(next)}
        callbackFailed={error === "callback"}
      />
      <Link
        href="/"
        className="text-muted-foreground hover:text-champagne text-sm underline-offset-4 hover:underline"
      >
        先以訪客身分占卜（紀錄只存在這台裝置）
      </Link>
    </div>
  );
}
