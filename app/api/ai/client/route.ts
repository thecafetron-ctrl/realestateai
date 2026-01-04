import { NextResponse } from "next/server";
import { z } from "zod";

import { prompts, testingFallbacks } from "@/lib/ai/prompts";
import { runChatCompletion, isTestingMode } from "@/lib/ai/chat";
import { handleApiError, requireUser } from "@/lib/api/route-helpers";

const requestSchema = z.object({
  clientName: z.string(),
  stage: z.string(),
  agentName: z.string().default("Agent"),
  type: z.enum(["message", "reviewRequest", "referralFollowup"]),
});

const promptMap: Record<"message" | "reviewRequest" | "referralFollowup", keyof typeof prompts> = {
  message: "clientUpdate",
  reviewRequest: "reviewRequest",
  referralFollowup: "referralFollowup",
};

export async function POST(req: Request) {
  try {
    const payload = requestSchema.parse(await req.json());
    await requireUser();

    if (isTestingMode()) {
      return NextResponse.json({
        message:
          payload.type === "message"
            ? testingFallbacks.clientMessage
            : testingFallbacks.clientMessage,
      });
    }

    const prompt = prompts[promptMap[payload.type]]
      .replace("{{clientName}}", payload.clientName)
      .replace("{{stage}}", payload.stage)
      .replace("{{agentName}}", payload.agentName);

    const completion = await runChatCompletion(
      [
        { role: "system", content: prompts.systemIdentity },
        { role: "user", content: prompt },
      ],
      { temperature: 0.75 },
    );

    return NextResponse.json({
      message: completion?.trim() || testingFallbacks.clientMessage,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return handleApiError(error);
  }
}


