import { NextResponse } from "next/server";
import { z } from "zod";

import { prompts, testingFallbacks } from "@/lib/ai/prompts";
import { runChatCompletion, isTestingMode } from "@/lib/ai/chat";
import { ApiError, handleApiError, requireUser } from "@/lib/api/route-helpers";

const requestSchema = z.object({
  leadData: z.object({
    name: z.string(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    intent: z.string().optional().nullable(),
    budget: z.string().optional().nullable(),
    timeline: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export async function POST(req: Request) {
  try {
    const { leadData } = requestSchema.parse(await req.json());
    const { supabase, user } = await requireUser();

    const prompt = prompts.leadQualification.replace("{{leadData}}", JSON.stringify(leadData, null, 2));

    let aiResult: {
      intent: string;
      timeline: string;
      budget: string;
      lead_score: number;
      summary: string;
      stage: string;
    };

    if (isTestingMode()) {
      aiResult = testingFallbacks.leadQualification;
    } else {
      const completion = await runChatCompletion(
        [
          { role: "system", content: prompts.systemIdentity },
          { role: "user", content: prompt },
        ],
        { responseFormat: "json_object" },
      );

      if (!completion) {
        throw new ApiError("No response from OpenAI", 502);
      }

      try {
        aiResult = JSON.parse(completion);
      } catch (error) {
        console.error("[lead] failed to parse JSON", completion, error);
        throw new ApiError("AI response was not valid JSON", 502);
      }
    }

    const { data: insertedLead, error } = await supabase
      .from("leads")
      .insert({
        user_id: user.id,
        name: leadData.name,
        email: leadData.email ?? null,
        phone: leadData.phone ?? null,
        intent: aiResult.intent ?? leadData.intent ?? null,
        budget: aiResult.budget ?? leadData.budget ?? null,
        timeline: aiResult.timeline ?? leadData.timeline ?? null,
        lead_score: aiResult.lead_score,
        summary: aiResult.summary,
        stage: aiResult.stage ?? "engaged",
      })
      .select()
      .single();

    if (error) {
      console.error("[lead] failed to save lead", error);
      throw new ApiError("Failed to save lead", 500);
    }

    return NextResponse.json({
      lead: insertedLead,
      ai: aiResult,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return handleApiError(error);
  }
}


