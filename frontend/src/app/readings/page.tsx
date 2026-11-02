import { NewReadingForm } from "@/components/readings/new-reading-form";
import { ReadingList } from "@/components/readings/reading-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { errorMessage } from "@/lib/api/client";
import { createServerApiClient } from "@/lib/api/server";

export const metadata = { title: "占卜紀錄｜星語塔羅" };

export default async function ReadingsPage() {
  const api = await createServerApiClient();
  const { data, error } = await api.GET("/api/v1/readings").catch(() => ({
    data: undefined,
    error: undefined,
  }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8">
      <NewReadingForm />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">占卜紀錄</h2>
        {data ? (
          <ReadingList readings={data} />
        ) : (
          <Alert variant="destructive">
            <AlertDescription>
              無法載入占卜紀錄：{errorMessage(error)}
            </AlertDescription>
          </Alert>
        )}
      </section>
    </main>
  );
}
