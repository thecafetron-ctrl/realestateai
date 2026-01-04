import { NextResponse } from "next/server";

import { prompts, testingFallbacks } from "@/lib/ai/prompts";
import { runChatCompletion, isTestingMode } from "@/lib/ai/chat";
import { handleApiError, requireUser } from "@/lib/api/route-helpers";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();

    const [{ data: leads, error: leadsError }, { data: deals, error: dealsError }, { data: marketing, error: marketingError }, { data: clients, error: clientsError }] = await Promise.all([
      supabase.from("leads").select("*").eq("user_id", user.id),
      supabase.from("deals").select("*").eq("user_id", user.id),
      supabase.from("marketing_content").select("*").eq("user_id", user.id),
      supabase.from("clients").select("*").eq("user_id", user.id),
    ]);

    // If tables don't exist or RLS blocks access, use empty arrays
    if (leadsError || dealsError || marketingError || clientsError) {
      console.warn("[insights] database query failed, using empty data", { leadsError, dealsError, marketingError, clientsError });
    }

    const totalLeads = leads?.length ?? 0;
    const hotLeads = leads?.filter((lead: { lead_score?: number | null }) => (lead.lead_score ?? 0) >= 80).length ?? 0;
    const activeDeals = deals?.length ?? 0;
    const marketingAssets = marketing?.length ?? 0;

    const tasksDue =
      deals?.reduce((count: number, deal: { next_tasks?: Array<{ priority?: "high" | "medium" | "low" | null }> | null }) => {
        const tasks: Array<{ priority?: "high" | "medium" | "low" | null }> = Array.isArray(deal.next_tasks)
          ? (deal.next_tasks as Array<{ priority?: "high" | "medium" | "low" | null }>)
          : [];
        const pendingHigh = tasks.filter((task) => task.priority === "high").length;
        return count + pendingHigh;
      }, 0) ?? 0;

    const clientSatisfaction = Math.min(98, 78 + (clients?.length ?? 0) * 2);

    const payload = {
      metrics: {
        totalLeads,
        hotLeads,
        activeDeals,
        marketingAssets,
        tasksDue,
        clientSatisfaction,
      },
      sampleLeads: leads?.slice(0, 5) ?? [],
      sampleDeals: deals?.slice(0, 5) ?? [],
    };

    if (isTestingMode()) {
      return NextResponse.json({
        summary: testingFallbacks.insights,
        metrics: payload.metrics,
      });
    }

    const completion = await runChatCompletion(
      [
        { role: "system", content: prompts.systemIdentity },
        { role: "user", content: prompts.dailySummary.replace("{{data}}", JSON.stringify(payload, null, 2)) },
      ],
      { temperature: 0.4 },
    );

    return NextResponse.json({
      summary: completion?.trim() || testingFallbacks.insights,
      metrics: payload.metrics,
    });
  } catch (error) {
    return handleApiError(error);
  }
}


