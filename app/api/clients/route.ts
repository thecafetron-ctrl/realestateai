import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, handleApiError, requireUser } from "@/lib/api/route-helpers";

const createSchema = z.object({
  name: z.string(),
  deal_id: z.string().uuid().optional().nullable(),
  stage: z.string().optional().nullable(),
  last_message: z.string().optional().nullable(),
  next_action: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError("Failed to load clients", 500);
    }

    return NextResponse.json({ clients: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const payload = createSchema.parse(await req.json());
    const { supabase, user } = await requireUser();

    const { data, error } = await supabase
      .from("clients")
      .insert({
        user_id: user.id,
        name: payload.name,
        deal_id: payload.deal_id ?? null,
        stage: payload.stage ?? "Active",
        last_message: payload.last_message ?? null,
        next_action: payload.next_action ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError("Failed to create client", 500);
    }

    return NextResponse.json({ client: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return handleApiError(error);
  }
}


