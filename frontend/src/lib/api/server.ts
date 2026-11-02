import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createApiClient } from "./client";

/** API client for Server Components, using the signed-in user's session cookie. */
export async function createServerApiClient() {
  const supabase = await createClient();
  return createApiClient(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  });
}
