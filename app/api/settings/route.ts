import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, handleApiError, requireUser } from "@/lib/api/route-helpers";

const updateSchema = z.object({
  name: z.string().optional(),
  openaiApiKey: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, openai_api_key")
      .eq("id", user.id)
      .single();

    if (error) {
      throw new ApiError("Failed to load settings", 500);
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const payload = updateSchema.parse(await req.json());
    const { supabase, user } = await requireUser();

    const { data, error } = await supabase
      .from("users")
      .update({
        name: payload.name,
        openai_api_key: payload.openaiApiKey ?? null,
      })
      .eq("id", user.id)
      .select("id, name, email, openai_api_key")
      .single();

    if (error) {
      throw new ApiError("Failed to update settings", 500);
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return handleApiError(error);
  }
}


