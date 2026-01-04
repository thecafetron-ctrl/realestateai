import { NextResponse } from "next/server";
import { z } from "zod";

import { prompts, testingFallbacks } from "@/lib/ai/prompts";
import { runChatCompletion, isTestingMode } from "@/lib/ai/chat";
import { handleApiError, requireUser } from "@/lib/api/route-helpers";

const requestSchema = z.object({
  summary: z.string(),
  stage: z.string().default("engaged"),
  agentName: z.string().default("Agent"),
});

export async function POST(req: Request) {
  try {
    const payload = requestSchema.parse(await req.json());
    await requireUser();

    if (isTestingMode()) {
      return NextResponse.json({ message: testingFallbacks.leadFollowUpMessage });
    }

    const prompt = prompts.leadFollowUpMessage
      .replace("{{summary}}", payload.summary)
      .replace("{{stage}}", payload.stage)
      .replace("{{agentName}}", payload.agentName);

    const completion = await runChatCompletion(
      [
        { role: "system", content: prompts.systemIdentity },
        { role: "user", content: prompt },
      ],
      { temperature: 0.7 },
    );

    return NextResponse.json({ message: completion?.trim() || testingFallbacks.leadFollowUpMessage });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return handleApiError(error);
  }
}


