import type { components } from "@/lib/api/types";

export type ReadingCreate = components["schemas"]["ReadingCreate"];
export type ReadingUpdate = components["schemas"]["ReadingUpdate"];
export type FollowUpTurn = components["schemas"]["FollowUp"];

/** A saved reading; guests' readings have no user_id. */
export type SavedReading = Omit<components["schemas"]["Reading"], "user_id"> & {
  user_id?: string;
};

/**
 * Where readings are kept: the browser for guests, Supabase (through the API)
 * for signed-in users (US-13). Components only use this interface.
 */
export interface ReadingStore {
  kind: "local" | "cloud";
  list(): Promise<SavedReading[]>;
  create(data: ReadingCreate): Promise<SavedReading>;
  update(id: string, patch: ReadingUpdate): Promise<void>;
  remove(id: string): Promise<void>;
}
