import { NextResponse } from "next/server";

import { ApiError, handleApiError, requireUser } from "@/lib/api/route-helpers";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError("Failed to load deals", 500);
    }

    return NextResponse.json({ deals: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}


