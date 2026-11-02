import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold">星語塔羅</h1>
      <p className="text-muted-foreground max-w-md">
        抽牌、看牌義，聽 AI
        解讀師為你說說牌裡的故事。登入後，每次占卜都會保存在你的紀錄中。
      </p>
      <Link href="/readings" className={buttonVariants({ size: "lg" })}>
        開始占卜
      </Link>
    </main>
  );
}
