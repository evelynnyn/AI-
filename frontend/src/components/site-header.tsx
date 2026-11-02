import Link from "next/link";

import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-semibold">
          星語塔羅
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link href="/readings" className="hover:underline">
                占卜紀錄
              </Link>
              <span className="text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm">
                  登出
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login" className="hover:underline">
              登入
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
