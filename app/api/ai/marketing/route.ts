import { NextResponse } from "next/server";
import { z } from "zod";

import { prompts, testingFallbacks } from "@/lib/ai/prompts";
import { runChatCompletion, isTestingMode } from "@/lib/ai/chat";
import { ApiError, handleApiError, requireUser } from "@/lib/api/route-helpers";

const requestSchema = z.object({
  type: z.enum(["instagramCaption", "listingVideoScript", "blogPost"]),
  details: z.string(),
});

const promptKey: Record<"instagramCaption" | "listingVideoScript" | "blogPost", keyof typeof prompts> = {
  instagramCaption: "instagramCaption",
  listingVideoScript: "listingVideoScript",
  blogPost: "blogPost",
};

export async function POST(req: Request) {
  try {
    const { type, details } = requestSchema.parse(await req.json());
    const { supabase, user } = await requireUser();

    const promptTemplate = prompts[promptKey[type]];
    const prompt = promptTemplate.replace("{{details}}", details);

    let content: string;

    if (isTestingMode()) {
      content = testingFallbacks.marketing;
    } else {
      const completion = await runChatCompletion(
        [
          { role: "system", content: prompts.systemIdentity },
          { role: "user", content: prompt },
        ],
        { temperature: 0.85 },
      );

      content = completion?.trim() ?? testingFallbacks.marketing;
    }

    const { data: inserted, error } = await supabase
      .from("marketing_content")
      .insert({
        user_id: user.id,
        listing_details: details,
        content_type: type,
        generated_text: content,
      })
      .select()
      .single();

    if (error) {
      console.error("[marketing] failed to save content", error);
      throw new ApiError("Failed to store marketing content", 500);
    }

    return NextResponse.json({ content: inserted });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return handleApiError(error);
  }
}


