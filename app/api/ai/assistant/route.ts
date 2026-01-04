import { NextResponse } from "next/server";
import { z } from "zod";

import { prompts, testingFallbacks } from "@/lib/ai/prompts";
import { getOpenAIClient, isTestingMode } from "@/lib/ai/openai";
import { ApiError, handleApiError, requireUser } from "@/lib/api/route-helpers";

const requestSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export async function POST(req: Request) {
  try {
    const { message } = requestSchema.parse(await req.json());
    const { supabase, user } = await requireUser();

    let history: Array<{ id: string; sender: string; content: string }> = [];
    try {
      const { data } = await supabase
        .from("messages")
        .select("id, sender, content")
        .eq("user_id", user.id)
        .is("client_id", null)
        .order("created_at", { ascending: true })
        .limit(25);
      history = data ?? [];
    } catch (error) {
      console.warn("[assistant] failed to load history, continuing without it", error);
    }

    // Persist the agent message immediately (ignore errors if table doesn't exist)
    try {
      await supabase.from("messages").insert({
        user_id: user.id,
        client_id: null,
        sender: "agent",
        content: message,
      });
    } catch (error) {
      console.warn("[assistant] failed to persist message, continuing", error);
    }

    if (isTestingMode()) {
      const fallback = testingFallbacks.assistant;
      try {
        await supabase.from("messages").insert({
          user_id: user.id,
          client_id: null,
          sender: "ai",
          content: fallback,
        });
      } catch (error) {
        console.warn("[assistant] failed to persist test response", error);
      }
      return NextResponse.json({ message: fallback });
    }

    const client = getOpenAIClient();
    if (!client) {
      throw new ApiError("OpenAI client not configured", 500);
    }

    const chatHistory =
      history?.map((item) => ({
        role: item.sender === "ai" ? ("assistant" as const) : ("user" as const),
        content: item.content,
      })) ?? [];

    const completion = await client.chat.completions.create({
      model: "gpt-4-turbo",
      stream: true,
      temperature: 0.6,
      messages: [
        { role: "system", content: prompts.systemIdentity },
        ...chatHistory,
        { role: "user", content: message },
      ],
    });

    let fullResponse = "";
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (error) {
          console.error("[assistant] stream error", error);
          controller.error(error);
        } finally {
          controller.close();
          if (fullResponse.trim().length > 0) {
            try {
              await supabase.from("messages").insert({
                user_id: user.id,
                client_id: null,
                sender: "ai",
                content: fullResponse.trim(),
              });
            } catch (error) {
              console.warn("[assistant] failed to persist AI response", error);
            }
          }
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return handleApiError(error);
  }
}


