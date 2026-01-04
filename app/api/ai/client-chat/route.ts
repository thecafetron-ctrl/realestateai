import { NextResponse } from "next/server";
import { z } from "zod";

import { testingFallbacks } from "@/lib/ai/prompts";
import { getOpenAIClient, isTestingMode } from "@/lib/ai/openai";
import { ApiError, handleApiError, requireUser } from "@/lib/api/route-helpers";

const requestSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  message: z.string().min(1, "Message is required"),
});

export async function POST(req: Request) {
  try {
    const { clientId, message } = requestSchema.parse(await req.json());
    const { supabase, user } = await requireUser();

    const { data: client } = await supabase
      .from("clients")
      .select("id, name, stage")
      .eq("id", clientId)
      .eq("user_id", user.id)
      .single();

    if (!client) {
      throw new ApiError("Client not found", 404);
    }

    const { data: history } = await supabase
      .from("messages")
      .select("id, sender, content")
      .eq("user_id", user.id)
      .eq("client_id", clientId)
      .order("created_at", { ascending: true })
      .limit(25);

    await supabase.from("messages").insert({
      user_id: user.id,
      client_id: clientId,
      sender: "agent",
      content: message,
    });

    if (isTestingMode()) {
      const fallback = testingFallbacks.assistant;
      await supabase.from("messages").insert({
        user_id: user.id,
        client_id: clientId,
        sender: "client", // AI responses appear as client messages
        content: fallback,
      });
      return NextResponse.json({ message: fallback });
    }

    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      throw new ApiError("OpenAI client not configured", 500);
    }

    const clientContext = `You are ${client.name}, a client in the ${client.stage || "Active"} stage of your real estate journey. You are responding to your real estate agent's message. Be friendly, professional, and engaged. Keep responses concise and natural, like a real client would text.`;

    const chatHistory =
      history?.map((item) => ({
        role: item.sender === "client" || item.sender === "ai" ? ("assistant" as const) : ("user" as const),
        content: item.content,
      })) ?? [];

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4-turbo",
      stream: true,
      temperature: 0.7,
      messages: [
        { role: "system", content: clientContext },
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
          console.error("[client-chat] stream error", error);
          controller.error(error);
        } finally {
          controller.close();
          if (fullResponse.trim().length > 0) {
            await supabase.from("messages").insert({
              user_id: user.id,
              client_id: clientId,
              sender: "client", // AI responses appear as client messages
              content: fullResponse.trim(),
            });
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



