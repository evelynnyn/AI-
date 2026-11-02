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
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <LoginForm
        next={safeNextPath(next)}
        callbackFailed={error === "callback"}
      />
    </main>
  );
}
