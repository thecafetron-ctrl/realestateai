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
  
  // Provide fallback URLs if env vars are missing (for demo mode)
  const url = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
  const anonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

  return createServerClient<Database>(
    url,
    anonKey,
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


