import createFetchClient, { type Middleware } from "openapi-fetch";

import type { components, paths } from "./types";

export type Reading = components["schemas"]["Reading"];
export type ReadingCreate = components["schemas"]["ReadingCreate"];
export type DrawnCard = components["schemas"]["DrawnCard"];

type TokenGetter = () => Promise<string | undefined>;

/**
 * The only entry point for calling the FastAPI backend.
 * Attaches the Supabase JWT as `Authorization: Bearer <token>`.
 */
export function createApiClient(getAccessToken: TokenGetter) {
  const client = createFetchClient<paths>({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
  });

  const auth: Middleware = {
    async onRequest({ request }) {
      const token = await getAccessToken();
      if (token) request.headers.set("Authorization", `Bearer ${token}`);
      return request;
    },
  };
  client.use(auth);

  return client;
}

/** Turn the backend's `{"detail": ...}` error body into a message for the user. */
export function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "detail" in error) {
    const { detail } = error as { detail: unknown };
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return "輸入的資料格式不正確";
  }
  return "連線發生問題，請稍後再試一次";
}
