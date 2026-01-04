import { cookies } from "next/headers";
import { cache } from "react";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "./types";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn(
    "[supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. API routes will not be able to connect to Supabase.",
  );
}

export const createSupabaseServerClient = cache(() => {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
            });
          } catch (error) {
            console.warn("[supabase] failed to set cookie", error);
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({
              name,
              value: "",
              ...options,
              maxAge: 0,
            });
          } catch (error) {
            console.warn("[supabase] failed to remove cookie", error);
          }
        },
      },
    },
  );
});


