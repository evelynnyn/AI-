import type {
  ReadingCreate,
  ReadingStore,
  ReadingUpdate,
  SavedReading,
} from "./types";

/** Guests' readings, newest first, kept only in this browser. */
export const STORAGE_KEY = "star-tarot:readings";
const MAX_RECORDS = 100;
/** `storage` events only reach other tabs; this one notifies the current tab. */
const CHANGE_EVENT = "star-tarot:readings-change";

function read(): SavedReading[] {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(parsed) ? (parsed as SavedReading[]) : [];
  } catch {
    return []; // private mode, storage disabled or broken data
  }
}

function write(list: SavedReading[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(list.slice(0, MAX_RECORDS)),
    );
  } catch {
    // Storage full or disabled: the reading itself still works.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const localStore: ReadingStore = {
  kind: "local",
  async list() {
    return read();
  },
  async create(data: ReadingCreate) {
    const reading: SavedReading = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      question: data.question,
      spread: data.spread,
      reader: data.reader ?? "high-priestess",
      cards: data.cards.map((c) => ({ ...c, reversed: c.reversed ?? false })),
      interpretation: data.interpretation ?? null,
      suggestions: data.suggestions ?? [],
      follow_ups: data.follow_ups ?? [],
    };
    write([reading, ...read()]);
    return reading;
  },
  async update(id: string, patch: ReadingUpdate) {
    const clean = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined && v !== null),
    );
    write(read().map((r) => (r.id === id ? { ...r, ...clean } : r)));
  },
  async remove(id: string) {
    write(read().filter((r) => r.id !== id));
  },
};

export function subscribeLocal(callback: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}
