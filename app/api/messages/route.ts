import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, handleApiError, requireUser } from "@/lib/api/route-helpers";

const createSchema = z.object({
  clientId: z.string().uuid().optional().nullable(),
  sender: z.enum(["agent", "ai", "client"]),
  content: z.string(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const { supabase, user } = await requireUser();

    let query = supabase
      .from("messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (clientId) {
      query = query.eq("client_id", clientId);
    } else {
      query = query.is("client_id", null);
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiError("Failed to load messages", 500);
    }

    return NextResponse.json({ messages: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const payload = createSchema.parse(await req.json());
    const { supabase, user } = await requireUser();

    const { data, error } = await supabase
      .from("messages")
      .insert({
        user_id: user.id,
        client_id: payload.clientId ?? null,
        sender: payload.sender,
        content: payload.content,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError("Failed to store message", 500);
    }

    return NextResponse.json({ message: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return handleApiError(error);
  }
}


