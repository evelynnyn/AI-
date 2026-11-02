import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Reading } from "@/lib/api/client";
import { cardName, READERS, SPREADS } from "@/lib/tarot/cards";

import { DeleteReadingButton } from "./delete-reading-button";

const dateFormat = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Taipei",
});

export function ReadingList({ readings }: { readings: Reading[] }) {
  if (readings.length === 0) {
    return (
      <p className="text-muted-foreground">
        還沒有占卜紀錄，先來抽第一次牌吧！
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {readings.map((reading) => (
        <li key={reading.id}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{reading.question}</CardTitle>
              <CardDescription>
                {dateFormat.format(new Date(reading.created_at))}・
                {SPREADS[reading.spread].label}
                ・解讀師：{READERS[reading.reader]}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ul className="flex flex-wrap gap-2">
                {reading.cards.map((card) => (
                  <li
                    key={card.position}
                    className="bg-muted rounded-md px-3 py-1.5 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {card.position}：
                    </span>
                    {cardName(card.card_id)}
                    {card.reversed && "（逆位）"}
                  </li>
                ))}
              </ul>
              {reading.interpretation && (
                <p className="text-sm whitespace-pre-line">
                  {reading.interpretation}
                </p>
              )}
              <DeleteReadingButton readingId={reading.id} />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
