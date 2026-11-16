"use client";

import { useEffect, useState } from "react";

import { createCloudStore } from "@/lib/history/cloud-store";
import { localStore } from "@/lib/history/local-store";
import type { ReadingStore } from "@/lib/history/types";
import { createClient } from "@/lib/supabase/client";

/**
 * The store for the current visitor: cloud when signed in, this browser otherwise.
 * `store` is null until the session has been checked.
 */
export function useReadingStore(): ReadingStore | null {
  const [store, setStore] = useState<ReadingStore | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const pick = (signedIn: boolean) =>
      setStore(signedIn ? createCloudStore() : localStore);

    supabase.auth.getSession().then(({ data }) => pick(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      pick(!!session),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return store;
}
