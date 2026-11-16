import Link from "next/link";

import { signOut } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/server";

const pill =
  "border-champagne-soft text-cream hover:border-champagne hover:text-champagne rounded-full border px-4 py-1.5 text-sm transition";

/** Header: site name home on the left; history and sign-in state on the right. */
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-champagne/15 bg-abyss/85 sticky top-0 z-30 border-b backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-display text-champagne text-lg tracking-[0.2em]"
        >
          ✦ 星語塔羅
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/readings" className={pill}>
            占卜紀錄
          </Link>
          {user ? (
            <>
              <span className="text-muted-foreground hidden max-w-[10rem] truncate text-sm sm:inline">
                {user.email}
              </span>
              <form action={signOut}>
                <button type="submit" className={pill}>
                  登出
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className={pill}>
              登入
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
