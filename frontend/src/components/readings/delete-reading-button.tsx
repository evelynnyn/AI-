"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/client";
import { createBrowserApiClient } from "@/lib/api/browser";

export function DeleteReadingButton({ readingId }: { readingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    if (!window.confirm("確定要刪除這筆占卜紀錄嗎？")) return;
    startTransition(async () => {
      const { error: apiError } = await createBrowserApiClient().DELETE(
        "/api/v1/readings/{reading_id}",
        { params: { path: { reading_id: readingId } } },
      );
      if (apiError) {
        setError(errorMessage(apiError));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" onClick={onDelete} disabled={isPending}>
        {isPending ? "刪除中…" : "刪除"}
      </Button>
      {error && <span className="text-destructive text-sm">{error}</span>}
    </div>
  );
}
