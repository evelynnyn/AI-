import { createClient } from "@/lib/supabase/client";

import { createApiClient } from "./client";

/** API client for Client Components, using the browser's Supabase session. */
export function createBrowserApiClient() {
  const supabase = createClient();
  return createApiClient(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  });
}
