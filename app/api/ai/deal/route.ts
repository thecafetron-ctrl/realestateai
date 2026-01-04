import { NextResponse } from "next/server";
import { z } from "zod";

import { prompts, testingFallbacks } from "@/lib/ai/prompts";
import { runChatCompletion, isTestingMode } from "@/lib/ai/chat";
import { ApiError, handleApiError, requireUser } from "@/lib/api/route-helpers";

export const runtime = "nodejs";

const metadataSchema = z.object({
  buyer: z.string().optional().nullable(),
  seller: z.string().optional().nullable(),
  price: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError("Missing PDF file", 400);
    }

    const meta = metadataSchema.parse({
      buyer: formData.get("buyer")?.toString(),
      seller: formData.get("seller")?.toString(),
      price: formData.get("price")?.toString(),
      address: formData.get("address")?.toString(),
    });

    const { supabase, user } = await requireUser();

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const parsePdf = require("pdf-parse") as (data: Buffer) => Promise<{ text: string }>;
    const { text } = await parsePdf(fileBuffer);
    const contractText = text.slice(0, 15000); // avoid token overload

    let summaryResult: { summary: string; missingSignatures: string[] };
    let tasksResult: Array<{ title: string; owner: string; due_date: string | null; priority: string }>;

    if (isTestingMode()) {
      summaryResult = {
        summary: testingFallbacks.contractSummary.summary,
        missingSignatures: testingFallbacks.contractSummary.missingSignatures,
      };
      tasksResult = testingFallbacks.contractSummary.tasks;
    } else {
      const summaryPrompt = prompts.contractSummary.replace("{{documentText}}", contractText);
      const rawSummary = await runChatCompletion(
        [
          { role: "system", content: prompts.systemIdentity },
          { role: "user", content: summaryPrompt },
        ],
        { responseFormat: "json_object" },
      );

      if (!rawSummary) {
        throw new ApiError("Failed to generate deal summary", 502);
      }

      summaryResult = JSON.parse(rawSummary) as typeof summaryResult;

      const taskPrompt = prompts.taskListGenerator.replace("{{summary}}", summaryResult.summary);

      const rawTasks = await runChatCompletion(
        [
          { role: "system", content: prompts.systemIdentity },
          { role: "user", content: taskPrompt },
        ],
        { responseFormat: "json_object" },
      );

      if (!rawTasks) {
        throw new ApiError("Failed to generate task list", 502);
      }

      const parsedTasks = JSON.parse(rawTasks);
      tasksResult = Array.isArray(parsedTasks) ? parsedTasks : parsedTasks.tasks ?? [];
    }

    const filename = `contracts/${user.id}/${Date.now()}-${file.name.replace(/\\s+/g, "-").toLowerCase()}`;
    const { data: uploadResult, error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(filename, fileBuffer, {
        contentType: file.type || "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[deal] storage upload failed", uploadError);
      throw new ApiError("Failed to upload contract to storage", 500);
    }

    const publicUrl = supabase.storage.from("contracts").getPublicUrl(uploadResult.path).data?.publicUrl ?? null;

    const priceValue = meta.price ? Number(meta.price.replace(/[^0-9.]/g, "")) : null;

    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .insert({
        user_id: user.id,
        file_url: publicUrl,
        buyer: meta.buyer,
        seller: meta.seller,
        price: priceValue,
        address: meta.address,
        missing_signatures: summaryResult.missingSignatures,
        summary: summaryResult.summary,
        next_tasks: tasksResult,
      })
      .select()
      .single();

    if (dealError) {
      console.error("[deal] failed to save deal", dealError);
      throw new ApiError("Failed to store deal record", 500);
    }

    return NextResponse.json({
      deal,
      summary: summaryResult.summary,
      missingSignatures: summaryResult.missingSignatures,
      tasks: tasksResult,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }
    console.error("[deal] error", error);
    return handleApiError(error);
  }
}


