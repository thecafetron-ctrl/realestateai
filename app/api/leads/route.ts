import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, handleApiError, requireUser } from "@/lib/api/route-helpers";

const updateSchema = z.object({
  id: z.string().uuid(),
  stage: z.string().optional(),
  summary: z.string().optional(),
  lead_score: z.number().optional(),
});

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError("Failed to load leads", 500);
    }

    return NextResponse.json({ leads: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const payload = updateSchema.parse(await req.json());
    const { supabase, user } = await requireUser();

    const { data, error } = await supabase
      .from("leads")
      .update({
        stage: payload.stage,
        summary: payload.summary,
        lead_score: payload.lead_score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      throw new ApiError("Failed to update lead", 500);
    }

    return NextResponse.json({ lead: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return handleApiError(error);
  }
}


