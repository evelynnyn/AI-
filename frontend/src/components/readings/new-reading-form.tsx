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
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/api/client";
import { createBrowserApiClient } from "@/lib/api/browser";
import {
  drawCards,
  READERS,
  SPREADS,
  type Reader,
  type Spread,
} from "@/lib/tarot/cards";

export const QUESTION_MAX = 200;

export const readingSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "請輸入想問的問題")
    .max(QUESTION_MAX, `問題最多 ${QUESTION_MAX} 字`),
  spread: z.enum(Object.keys(SPREADS) as [Spread, ...Spread[]]),
  reader: z.enum(Object.keys(READERS) as [Reader, ...Reader[]]),
});

type ReadingForm = z.infer<typeof readingSchema>;

export function NewReadingForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReadingForm>({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      question: "",
      spread: "three_card",
      reader: "high_priestess",
    },
  });
  const questionLength = watch("question")?.length ?? 0;

  async function onSubmit(values: ReadingForm) {
    setError(null);
    const { error: apiError } = await createBrowserApiClient().POST(
      "/api/v1/readings",
      {
        body: { ...values, cards: drawCards(values.spread) },
      },
    );
    if (apiError) {
      setError(errorMessage(apiError));
      return;
    }
    reset({ ...values, question: "" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>新的占卜</CardTitle>
        <CardDescription>
          洗牌與選牌畫面完成前，先由系統隨機從 22
          張大牌中抽牌，並保存到你的紀錄。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="question">你想問什麼？</Label>
            <Textarea
              id="question"
              rows={3}
              maxLength={QUESTION_MAX}
              placeholder="例如：接下來三個月，我在工作上需要注意什麼？"
              aria-invalid={!!errors.question}
              {...register("question")}
            />
            <div className="flex justify-between text-sm">
              <span className="text-destructive">
                {errors.question?.message}
              </span>
              <span className="text-muted-foreground">
                {questionLength} / {QUESTION_MAX}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="spread">牌陣</Label>
              <NativeSelect id="spread" {...register("spread")}>
                {Object.entries(SPREADS).map(([value, { label }]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reader">解讀師</Label>
              <NativeSelect id="reader" {...register("reader")}>
                {Object.entries(READERS).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? "抽牌中…" : "抽牌並保存"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
