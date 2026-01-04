import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
  ) {
    super(message);
  }
}

export async function requireUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Return demo user if no session
  if (!session?.user) {
    return {
      supabase,
      user: {
        id: "demo-user",
        email: "demo@example.com",
        user_metadata: {},
      },
    };
  }

  return { supabase, user: session.user };
}

export function handleApiError(error: unknown) {
  console.error("[api] error", error);
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}


