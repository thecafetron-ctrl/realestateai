"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { animate, motion, useMotionValue } from "framer-motion";
import { ArrowUpRight, ClipboardList, Flame, MessageCircle, Sparkles, Target } from "lucide-react";

import { useSampleMode } from "@/components/sample-mode-provider";
import { demoInsight } from "@/lib/sampleData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type InsightsResponse = {
  summary: string;
  metrics: {
    totalLeads: number;
    hotLeads: number;
    activeDeals: number;
    marketingAssets: number;
    tasksDue: number;
    clientSatisfaction: number;
  };
};

const fetchInsights = async (): Promise<InsightsResponse> => {
  const response = await fetch("/api/ai/insights");
  if (!response.ok) {
    throw new Error("Failed to load insights");
  }
  return response.json() as Promise<InsightsResponse>;
};

export default function DashboardPage() {
  const { isSampleMode, leads, deals, posts, insight, loadSampleData, clearSampleData, setInsight } = useSampleMode();
  const [runningDemo, setRunningDemo] = useState(false);
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard-insights"],
    queryFn: fetchInsights,
    staleTime: 1000 * 60,
    enabled: !isSampleMode,
    retry: false,
  });

  useEffect(() => {
    if (error && !isSampleMode) {
      loadSampleData();
    }
  }, [error, isSampleMode, loadSampleData]);

  const sampleMetrics = useMemo(() => {
    if (!isSampleMode) return null;
    const totalLeads = leads.length;
    const hotLeads = leads.filter((lead) => lead.score >= 80).length;
    const activeDeals = deals.length;
    const marketingAssets = posts.length;
    const tasksDue = Math.max(2, deals.length);
    const clientSatisfaction = 92;
    return { totalLeads, hotLeads, activeDeals, marketingAssets, tasksDue, clientSatisfaction };
  }, [isSampleMode, leads, deals, posts]);

  const metrics = useMemo(() => {
    const source = isSampleMode ? sampleMetrics ?? undefined : data?.metrics;
    const loading = isSampleMode ? false : isLoading;

    return {
      loading,
      items: [
        {
          label: "Total leads",
          value: source?.totalLeads ?? 0,
          suffix: "",
          icon: <Target className="h-5 w-5 text-purple-400" />,
          delta: isSampleMode ? "+5 ready for outreach" : "+12 this week",
        },
        {
          label: "Hot leads",
          value: source?.hotLeads ?? 0,
          suffix: "",
          icon: <Flame className="h-5 w-5 text-orange-500" />,
          delta: "score 80+",
        },
        {
          label: "Active deals",
          value: source?.activeDeals ?? 0,
          suffix: "",
          icon: <ArrowUpRight className="h-5 w-5 text-emerald-500" />,
          delta: isSampleMode ? "2 in escrow" : "pipeline momentum",
        },
        {
          label: "Client satisfaction",
          value: source?.clientSatisfaction ?? 0,
          suffix: "%",
          icon: <Sparkles className="h-5 w-5 text-purple-500" />,
          delta: "Concierge NPS",
        },
      ],
    };
  }, [data, isLoading, isSampleMode, sampleMetrics]);

  const summaryText = isSampleMode ? insight : data?.summary;

  const handleDemoBriefing = () => {
    setRunningDemo(true);
    setInsight("");
    setTimeout(() => {
      setInsight(demoInsight);
      setRunningDemo(false);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary bg-clip-text text-transparent premium-gradient">Revenue Operations Pulse</h1>
          <p className="text-sm text-text-tertiary mt-2">Live intelligence from lead engine, marketing, deal desk, and concierge.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isSampleMode && (
            <Button variant="outline" onClick={loadSampleData} className="rounded-2xl border-purple-500/30">
              Load Sample Data
            </Button>
          )}
          {isSampleMode && (
            <Button
              variant="outline"
              onClick={() => {
                clearSampleData();
                refetch();
              }}
              className="rounded-2xl border-purple-500/30"
            >
              Clear Sample Data
            </Button>
          )}
          <Button
            variant="ghost"
            className="rounded-2xl border border-purple-500/20 hover:border-purple-500/40"
            onClick={() => refetch()}
            disabled={isRefetching || isSampleMode}
          >
            {isRefetching ? "Refreshing…" : "Refresh insights"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.items.map((metric, index) => (
          <motion.div key={metric.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className="hover:shadow-purple-glow-sm transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardDescription className="text-xs uppercase tracking-wide text-text-tertiary">{metric.label}</CardDescription>
                  <CardTitle className="text-3xl font-bold text-text-primary">
                    {metrics.loading ? (
                      <span className="animate-pulse text-text-tertiary">•••</span>
                    ) : (
                      <motion.span key={`${metric.label}-${metric.value}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <AnimatedNumber value={metric.value} suffix={metric.suffix} />
                      </motion.span>
                    )}
                  </CardTitle>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-purple-glow-sm">
                  {metric.icon}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium text-emerald-400">{metric.delta}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card className="hover:shadow-purple-glow-sm transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-text-primary">AI Assistant Insights</CardTitle>
                <CardDescription className="text-text-tertiary">
                  The system synthesizes live CRM, marketing, deal, and concierge signals.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isSampleMode && (
                  <Button variant="subtle" size="sm" onClick={handleDemoBriefing} disabled={runningDemo} className="rounded-xl border-purple-500/30">
                    {runningDemo ? "Generating…" : "Run Demo AI Briefing"}
                  </Button>
                )}
                <Badge variant="subtle" className="rounded-xl px-3 py-1 text-xs text-purple-400 border-purple-500/30">
                  GPT-4 Turbo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!isSampleMode && error && (
                <p className="rounded-2xl bg-rose-500/20 border border-rose-500/30 p-4 text-sm text-rose-300">Unable to load insights. Try refreshing.</p>
              )}
              {(isSampleMode && runningDemo) || (!isSampleMode && isLoading) ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-4 w-full animate-pulse rounded-full bg-surface-medium" />
                  ))}
                </div>
              ) : null}
              {!runningDemo && summaryText && (
                <ScrollArea className="max-h-60 overflow-hidden rounded-2xl border border-purple-500/20 bg-surface-dark/50 p-4">
                  <p className="whitespace-pre-line text-sm leading-6 text-text-secondary">{summaryText}</p>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="rounded-3xl border-none premium-gradient text-white shadow-purple-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <ClipboardList className="h-5 w-5" />
                Quick priorities
              </CardTitle>
              <CardDescription className="text-purple-100">High-leverage focus areas derived from your data graph.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PriorityItem icon={<Target className="h-4 w-4" />} text="Check-in with all hot leads scoring 80+ before noon." />
              <PriorityItem icon={<MessageCircle className="h-4 w-4" />} text="Trigger concierge review requests for closed clients this week." />
              <PriorityItem icon={<ArrowUpRight className="h-4 w-4" />} text="Review deal desk tasks flagged as high priority." />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function PriorityItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/10 border border-white/20 p-3 text-sm text-purple-50">
      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-purple-100">{icon}</div>
      <p>{text}</p>
    </div>
  );
}

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    motionValue.set(0);
    const controls = animate(motionValue, value, { duration: 0.6, ease: "easeOut" });
    const unsubscribe = motionValue.on("change", (latest) => {
      setDisplay(latest);
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [motionValue, value]);

  return (
    <span>
      {Math.round(display)}
      {suffix}
    </span>
  );
}


