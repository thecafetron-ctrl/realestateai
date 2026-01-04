"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ClipboardList, FileDigit, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { useSampleMode } from "@/components/sample-mode-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

type Deal = {
  id: string;
  file_url: string | null;
  buyer: string | null;
  seller: string | null;
  price: number | null;
  address: string | null;
  missing_signatures: string[] | null;
  summary: string | null;
  next_tasks: Array<{ title: string; owner: string; priority: string; due_date: string | null }> | null;
  created_at: string;
};

type DealCard = {
  id: string;
  property: string;
  buyer: string;
  seller: string;
  price: string;
  commission?: string;
  closedOn?: string;
  summary?: string;
  tasks?: Array<{ title: string; owner: string; priority: string }>; // normalized
};

type DemoAnalysis = { summary: string; missingSignatures: string[]; tasks: Deal["next_tasks"] };

const fetchDeals = async (): Promise<Deal[]> => {
  const response = await fetch("/api/deals");
  if (!response.ok) {
    throw new Error("Unable to load deals");
  }
  const data = (await response.json()) as { deals: Deal[] };
  return data.deals;
};

export default function DealDeskPage() {
  const queryClient = useQueryClient();
  const {
    isSampleMode,
    deals: sampleDeals,
    documents,
    addDocumentPlaceholder,
    removeDocument,
    loadSampleData,
    archiveDeal,
  } = useSampleMode();

  const { data: deals, isLoading, error: dealsError } = useQuery({
    queryKey: ["deals"],
    queryFn: fetchDeals,
    enabled: !isSampleMode,
    retry: false,
  });

  useEffect(() => {
    if (dealsError && !isSampleMode) {
      loadSampleData();
    }
  }, [dealsError, isSampleMode, loadSampleData]);

  const [form, setForm] = useState({
    buyer: "",
    seller: "",
    address: "",
    price: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<DemoAnalysis | null>(null);

  useEffect(() => {
    if (isSampleMode) {
      const primary = sampleDeals[0];
      setAnalysis({
        summary: primary ? `${primary.property} under contract. ${primary.neighborhood} review flagged for concierge.` : "Escrow workflows are humming.",
        missingSignatures: ["Buyer initials needed on inspection contingency", "Seller signature on addendum B"],
        tasks: [
          { title: "Confirm appraisal timeline", owner: "agent", priority: "high", due_date: null },
          { title: "Send closing checklist", owner: "transaction_coordinator", priority: "medium", due_date: null },
        ],
      });
    } else {
      setAnalysis(null);
    }
  }, [isSampleMode, sampleDeals]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (isSampleMode) {
        toast.success("Demo analysis generated", { description: "Sample tasks populated for the contract." });
        return {
          summary: analysis?.summary ?? "Inspection scheduled and appraisal in motion.",
          missingSignatures: analysis?.missingSignatures ?? ["Buyer initials on finance addendum"],
          tasks: analysis?.tasks ?? [],
        } satisfies DemoAnalysis;
      }

      if (!file) {
        throw new Error("Upload a PDF contract first");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("buyer", form.buyer);
      formData.append("seller", form.seller);
      formData.append("price", form.price);
      formData.append("address", form.address);

      const response = await fetch("/api/ai/deal", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Contract analysis failed");
      }
      return (await response.json()) as DemoAnalysis;
    },
    onSuccess: (data) => {
      if (!isSampleMode) {
        toast.success("Contract analyzed", { description: "Deal desk summary and tasks generated." });
        queryClient.invalidateQueries({ queryKey: ["deals"] });
      }
      setAnalysis(data);
      setFile(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Unable to analyze contract", { description: message });
    },
  });

  const documentLibrary = useMemo(() => {
    if (isSampleMode) {
      return documents;
    }
    return [];
  }, [documents, isSampleMode]);

  const dealLibrary: DealCard[] = useMemo(() => {
    if (isSampleMode) {
      return sampleDeals.map((deal) => ({
        id: deal.id,
        property: deal.property,
        buyer: deal.buyer,
        seller: deal.seller,
        price: deal.price,
        commission: deal.commission,
        closedOn: new Date(deal.closedOn).toLocaleDateString(),
        summary: `${deal.neighborhood} • Closed`,
        tasks: [
          { title: "Send thank-you hamper", owner: "concierge", priority: "medium" },
          { title: "Launch post-close drip", owner: "marketing", priority: "medium" },
        ],
      }));
    }

    return (deals ?? []).map((deal) => ({
      id: deal.id,
      property: deal.address ?? "Unnamed deal",
      buyer: deal.buyer ?? "Buyer",
      seller: deal.seller ?? "Seller",
      price: deal.price ? deal.price.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "TBD",
      summary: deal.summary ?? "Awaiting AI summary",
      tasks: (deal.next_tasks ?? []).map((task) => ({
        title: task.title,
        owner: task.owner,
        priority: task.priority,
      })),
    }));
  }, [deals, isSampleMode, sampleDeals]);

  const handleUploadSampleDoc = () => {
    const index = documentLibrary.length + 1;
    addDocumentPlaceholder(`Sample Disclosure ${index}.pdf`, "Demo Estate");
    toast.success("Demo document uploaded", { description: "Document tray refreshed." });
  };

  const handleRemoveDocument = (id: string) => {
    if (!isSampleMode) {
      toast.info("Manage live documents", { description: "Use storage console to remove real uploads." });
      return;
    }
    removeDocument(id);
    toast("Document removed", { description: "The sample file has been archived." });
  };

  const handleArchiveDeal = (id: string) => {
    if (!isSampleMode) {
      toast.info("Archive in CRM", { description: "Remove live deals directly in Supabase." });
      return;
    }
    archiveDeal(id);
    toast.success("Deal archived", { description: "Removed from demo history." });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary bg-clip-text text-transparent premium-gradient">Deal Desk</h1>
          <p className="text-sm text-text-tertiary mt-2">Upload contracts, track documents, and orchestrate closings with AI.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
              <Upload className="h-5 w-5 text-purple-400" />
              Upload contract
            </CardTitle>
            <CardDescription className="text-text-tertiary">
              PDF contracts are parsed, summarized, and converted into actionable tasks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-1 gap-6 lg:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                uploadMutation.mutate();
              }}
            >
              <div className="lg:col-span-2 space-y-2">
                <Label htmlFor="file">Contract PDF</Label>
                <Input
                  id="file"
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  required={!isSampleMode}
                />
                <p className="text-xs text-text-tertiary">Files route through secure Supabase storage.</p>
              </div>
              <div className="space-y-2">
                <Label>Buyer</Label>
                <Input value={form.buyer} onChange={(event) => setForm((prev) => ({ ...prev, buyer: event.target.value }))} placeholder="Jordan Parker" />
              </div>
              <div className="space-y-2">
                <Label>Seller</Label>
                <Input value={form.seller} onChange={(event) => setForm((prev) => ({ ...prev, seller: event.target.value }))} placeholder="Austin Estates LLC" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} placeholder="1188 Monarch Ridge" />
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="$2,400,000" />
              </div>
              <div className="lg:col-span-2 flex justify-end">
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={uploadMutation.isPending}
                  className="rounded-2xl px-6 py-3 text-base font-bold text-white shadow-purple-glow hover:shadow-purple-glow-sm"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Analyze contract
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
                <FileText className="h-5 w-5 text-purple-400" /> Documents
              </CardTitle>
              <CardDescription className="text-text-tertiary">
                Ten luxury-ready documents ship with the demo. Add or remove with one tap.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-purple-500/30"
              onClick={handleUploadSampleDoc}
            >
              Upload sample docs
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[420px] pr-3">
              <div className="space-y-3">
                {documentLibrary.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between rounded-2xl border border-purple-500/20 bg-surface-dark/50 px-4 py-3 hover:border-purple-500/40 hover:shadow-purple-glow-sm transition-all duration-300"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{doc.title}</p>
                      <p className="text-xs text-text-tertiary">
                        {doc.property} • {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium",
                          doc.status === "ready"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
                        )}
                      >
                        {doc.status === "ready" ? "Ready" : "Processing"}
                      </span>
                      <Button variant="ghost" size="icon" className="text-rose-400 hover:bg-rose-500/20" onClick={() => handleRemoveDocument(doc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
                {!documentLibrary.length && (
                  <div className="rounded-2xl border border-dashed border-purple-500/30 p-6 text-center text-sm text-text-tertiary">
                    No documents yet. Upload a sample file to showcase the workflow.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-text-primary">AI summary</CardTitle>
              <CardDescription className="text-text-tertiary">Key deal points and readiness status from the uploaded contract.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-text-secondary">{analysis.summary}</p>
              {analysis.missingSignatures.length > 0 && (
                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/20 p-4">
                  <h3 className="text-sm font-semibold text-amber-300">Missing signatures</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-200">
                    {analysis.missingSignatures.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Next tasks</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {(analysis.tasks ?? []).map((task) => (
                    <div key={`${task?.title}-${task?.owner}`} className="rounded-2xl border border-purple-500/20 bg-surface-dark/50 p-4 shadow-elevation-1">
                      <p className="text-sm font-semibold text-text-primary">{task?.title}</p>
                      <p className="text-xs text-text-tertiary capitalize">Owner: {task?.owner?.replace("_", " ")}</p>
                      <p className="text-xs text-text-tertiary">Priority: {task?.priority}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-text-primary">Deal history</CardTitle>
            <CardDescription className="text-text-tertiary">
              Historical contracts with AI summaries and concierge-ready next steps.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isSampleMode ? false : isLoading ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-44 animate-pulse rounded-3xl bg-surface-medium" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {dealLibrary.map((deal, index) => (
                <motion.div key={deal.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card className="rounded-3xl border border-purple-500/20 bg-surface-dark/50 shadow-elevation-1 hover:shadow-purple-glow-sm transition-all duration-300">
                    <CardHeader className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base text-text-primary">{deal.property}</CardTitle>
                        <CardDescription className="text-xs text-text-tertiary">
                          {deal.buyer} ↔ {deal.seller}
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" className="text-rose-400 hover:bg-rose-500/20" onClick={() => handleArchiveDeal(deal.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
                        <span className="font-medium text-text-primary">{deal.price}</span>
                        {deal.commission && <span>Commission {deal.commission}</span>}
                        {deal.closedOn && <span>Closed {deal.closedOn}</span>}
                      </div>
                      {deal.summary && <p className="text-sm leading-6 text-text-secondary">{deal.summary}</p>}
                      <ScrollArea className="max-h-32">
                        <div className="space-y-2">
                          {(deal.tasks ?? []).map((task) => (
                            <div key={task.title} className="rounded-xl border border-purple-500/20 bg-surface-dark/50 p-3 shadow-elevation-1">
                              <p className="text-sm font-medium text-text-primary">{task.title}</p>
                              <p className="text-xs text-text-tertiary">Owner: {task.owner}</p>
                              <p className="text-xs text-text-tertiary capitalize">Priority: {task.priority}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {isSampleMode ? null : (
                        <a href="#" className="inline-flex text-sm font-medium text-purple-400 hover:text-purple-300">
                          <FileDigit className="mr-2 h-4 w-4" />
                          View contract PDF
                        </a>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
          {!isSampleMode && !isLoading && !dealLibrary.length && (
            <div className="mt-6 rounded-3xl border border-dashed border-purple-500/30 p-10 text-center text-sm text-text-tertiary">
              No deals yet. Analyze a contract to populate the desk.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}


