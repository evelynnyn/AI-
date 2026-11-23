"use client";

import Link from "next/link";

import { useReadingStore } from "@/hooks/use-reading-store";

import { HistoryList } from "./history-list";

/** History for guests (this browser) and signed-in users (cloud) (US-13, US-14). */
export function HistoryPage() {
  const store = useReadingStore();

  return (
    <div className="mx-auto max-w-2xl pt-8">
      <h1 className="font-serif-tc text-cream title-glow text-center text-3xl font-bold tracking-[0.15em]">
        占卜紀錄
      </h1>
      {store?.kind === "local" && (
        <p className="text-muted-foreground mt-2 text-center text-sm">
          紀錄只保存在這台裝置的瀏覽器中。
          <Link
            href="/login?next=%2Freadings"
            className="text-champagne ml-1 underline-offset-4 hover:underline"
          >
            登入
          </Link>
          後，新的占卜會保存到你的帳號，換裝置也看得到。
        </p>
      )}
      {store?.kind === "cloud" && (
        <p className="text-muted-foreground mt-2 text-center text-sm">
          紀錄保存在你的帳號中
        </p>
      )}
      <HistoryList store={store} />
    </div>
  );
}
