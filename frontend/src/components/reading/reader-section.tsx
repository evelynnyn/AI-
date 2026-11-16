"use client";

import { useState } from "react";

import type { AiReadingRequest } from "@/lib/api/stream";
import type {
  FollowUpTurn,
  ReadingStore,
  ReadingUpdate,
} from "@/lib/history/types";
import type { Reader } from "@/lib/tarot/readers";

import { FollowUpChat } from "./follow-up-chat";
import { ReaderMessage } from "./reader-message";

interface ReaderSectionProps {
  reader: Reader;
  reading: AiReadingRequest;
  /** The saved reading to write the AI reading and follow-ups into (US-14). */
  recordId: string | null;
  store: ReadingStore | null;
  initialAiReading?: string | null;
  initialFollowUps?: FollowUpTurn[];
  initialSuggestions?: string[];
  autoStart?: boolean;
}

/** The AI reader: main reading, then follow-ups. Used by the flow and the history page. */
export function ReaderSection({
  reader,
  reading,
  recordId,
  store,
  initialAiReading,
  initialFollowUps,
  initialSuggestions,
  autoStart = false,
}: ReaderSectionProps) {
  const [aiReading, setAiReading] = useState(initialAiReading ?? undefined);

  const save = (patch: ReadingUpdate) => {
    // Saving is best effort; the reading on screen stays either way.
    if (recordId && store) store.update(recordId, patch).catch(() => {});
  };

  return (
    <>
      <ReaderMessage
        reader={reader}
        request={reading}
        initialText={initialAiReading}
        autoStart={autoStart}
        onComplete={(text) => {
          setAiReading(text);
          save({ interpretation: text });
        }}
      />
      {aiReading && (
        <FollowUpChat
          reader={reader}
          reading={reading}
          aiReading={aiReading}
          initialTurns={initialFollowUps}
          initialSuggestions={initialSuggestions}
          onTurnsChange={(follow_ups) => save({ follow_ups })}
          onSuggestions={(suggestions) => save({ suggestions })}
        />
      )}
    </>
  );
}
