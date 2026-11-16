import { createBrowserApiClient } from "@/lib/api/browser";
import { errorMessage } from "@/lib/api/client";

import type { ReadingCreate, ReadingStore, ReadingUpdate } from "./types";

/** Signed-in users' readings, saved through the FastAPI backend (RLS protects them). */
export function createCloudStore(api = createBrowserApiClient()): ReadingStore {
  return {
    kind: "cloud",
    async list() {
      const { data, error } = await api.GET("/api/v1/readings");
      if (error || !data) throw new Error(errorMessage(error));
      return data;
    },
    async create(body: ReadingCreate) {
      const { data, error } = await api.POST("/api/v1/readings", { body });
      if (error || !data) throw new Error(errorMessage(error));
      return data;
    },
    async update(id: string, body: ReadingUpdate) {
      const { error } = await api.PATCH("/api/v1/readings/{reading_id}", {
        params: { path: { reading_id: id } },
        body,
      });
      if (error) throw new Error(errorMessage(error));
    },
    async remove(id: string) {
      const { error } = await api.DELETE("/api/v1/readings/{reading_id}", {
        params: { path: { reading_id: id } },
      });
      if (error) throw new Error(errorMessage(error));
    },
  };
}
