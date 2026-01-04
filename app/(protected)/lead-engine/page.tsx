"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarRange,
  Clock,
  Edit3,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Zap,
  Calendar,
  Timer,
  Pause,
  Play,
} from "lucide-react";
import { toast } from "sonner";

import { useSampleMode } from "@/components/sample-mode-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const leadSources = ["Zillow", "Referral", "Google PPC", "Instagram", "LinkedIn", "Open House", "Past Client"];
const leadTimelines = ["Immediate", "30 days", "60 days", "90 days", "3-6 months", "6+ months"];

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  source: "Zillow",
  location: "",
  budget: "",
  timeline: "60 days",
  notes: "",
};

type LeadFormState = typeof initialFormState;

function composeQuickMessage({ name, location, timeline }: { name: string; location: string; timeline: string }) {
  const firstName = name.split(" ")[0] ?? "there";
  return `Hi ${firstName}, I just unlocked fresh homes in ${location || "your target area"}. They line up with your ${timeline.toLowerCase()} move window. Want me to fast-track a private tour?`;
}

export default function LeadEnginePage() {
  const {
    leads,
    conversations,
    addLeadFromLibrary,
    createLead,
    updateLead,
    deleteLead,
    prepareFollowUp,
    followUpDraft,
    clearFollowUpDraft,
    appendConversationMessage,
  } = useSampleMode();

  const [form, setForm] = useState<LeadFormState>(initialFormState);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<LeadFormState>(initialFormState);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [selectedLeadName, setSelectedLeadName] = useState<string | null>(null);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [scheduledFollowUps, setScheduledFollowUps] = useState<Array<{
    id: string;
    leadId: string;
    leadName: string;
    scheduledFor: Date;
    status: "pending" | "sent" | "snoozed";
    message?: string;
    delay: string;
  }>>([]);
  const [schedulingLeadId, setSchedulingLeadId] = useState<string | null>(null);
  const [scheduleDelay, setScheduleDelay] = useState("1 hour");

  const orderedLeads = useMemo(
    () =>
      [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [leads],
  );

  useEffect(() => {
    if (!followUpDraft) return;
    setSelectedLeadName(() => {
      const lead = leads.find((item) => item.id === followUpDraft.leadId);
      return lead?.name ?? null;
    });
    setFollowUpOpen(true);
  }, [followUpDraft, leads]);

  const handleCreateLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name required", { description: "Add at least a lead name to continue." });
      return;
    }
    createLead({ ...form });
    toast.success("Lead captured", { description: `${form.name} dropped into the pipeline.` });
    setForm(initialFormState);
  };

  const handleSaveLead = () => {
    if (!editingLeadId) return;
    updateLead(editingLeadId, {
      name: editingForm.name.trim() || editingForm.name,
      email: editingForm.email,
      phone: editingForm.phone,
      source: editingForm.source,
      location: editingForm.location,
      budget: editingForm.budget,
      timeline: editingForm.timeline,
      notes: editingForm.notes,
      lastContact: "just now",
    });
    toast.success("Lead updated", { description: `${editingForm.name} refreshed.` });
    setEditingLeadId(null);
  };

  const openEditDialog = (leadId: string) => {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;
    setEditingLeadId(leadId);
    setEditingForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      location: lead.location,
      budget: lead.budget,
      timeline: lead.timeline,
      notes: lead.notes,
    });
  };

  const handleDeleteLead = (leadId: string, name: string) => {
    deleteLead(leadId);
    toast("Lead removed", { description: `${name} archived from the demo pipeline.` });
  };

  const handleFollowUp = (leadId: string) => {
    prepareFollowUp(leadId);
  };

  const handleSendText = (leadId: string) => {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;
    const message = composeQuickMessage({ name: lead.name, location: lead.location, timeline: lead.timeline });
    const conversation = conversations.find((item) => item.clientName === lead.name);
    if (conversation) {
      appendConversationMessage(conversation.id, message, "agent");
    }
    toast.success("Text delivered", { description: message });
  };

  const scheduleAutomatedFollowUp = (leadId: string, delay: string) => {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;

    const delayHours: Record<string, number> = {
      "1 hour": 1,
      "4 hours": 4,
      "1 day": 24,
      "2 days": 48,
      "3 days": 72,
      "1 week": 168,
    };

    const hours = delayHours[delay] || 24;
    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + hours);

    const newFollowUp = {
      id: `followup-${leadId}-${Date.now()}`,
      leadId,
      leadName: lead.name,
      scheduledFor,
      status: "pending" as const,
      message: composeQuickMessage({ name: lead.name, location: lead.location, timeline: lead.timeline }),
      delay,
    };

    setScheduledFollowUps((prev) => [...prev, newFollowUp]);
    toast.success("Follow-up scheduled", { description: `Automated message scheduled for ${lead.name} in ${delay}.` });
  };

  const cancelScheduledFollowUp = (followUpId: string) => {
    setScheduledFollowUps((prev) => prev.filter((f) => f.id !== followUpId));
    toast("Follow-up cancelled", { description: "Scheduled follow-up has been removed." });
  };

  const sendScheduledFollowUp = (followUpId: string) => {
    const followUp = scheduledFollowUps.find((f) => f.id === followUpId);
    if (!followUp) return;

    const conversation = conversations.find((item) => item.clientName === followUp.leadName);
    if (conversation && followUp.message) {
      appendConversationMessage(conversation.id, followUp.message, "agent");
    }

    setScheduledFollowUps((prev) =>
      prev.map((f) => (f.id === followUpId ? { ...f, status: "sent" as const } : f)),
    );

    setTimeout(() => {
      setScheduledFollowUps((prev) => prev.filter((f) => f.id !== followUpId));
    }, 3000);

    toast.success("Follow-up sent", { description: `Message delivered to ${followUp.leadName}.` });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary bg-clip-text text-transparent premium-gradient">
            Lead Engine
          </h1>
          <p className="text-sm text-text-tertiary mt-2">
            Luxury-grade capture, instant qualification, and concierge follow-up built for showcase demos.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="gradient"
            size="lg"
            className="rounded-2xl px-6 shadow-purple-glow hover:shadow-purple-glow-sm"
            onClick={() => {
              addLeadFromLibrary();
              toast.success("Sample lead entered", { description: "Another VIP just stepped into the pipeline." });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Enter Sample Lead
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-purple-500/10" />
          <CardHeader className="relative space-y-1">
            <CardTitle className="text-lg font-semibold text-text-primary">Create a lead</CardTitle>
            <CardDescription className="text-text-tertiary">
              Showcase instant AI qualification with luxury-ready defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <form className="space-y-4" onSubmit={handleCreateLead}>
              <div className="space-y-2">
                <Label htmlFor="lead-name">Lead name</Label>
                <Input
                  id="lead-name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Sarah Williams"
                  className="rounded-2xl"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="sarah@brand.co"
                    className="rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder="+1 (555) 012-8830"
                    className="rounded-2xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={form.source} onValueChange={(value) => setForm((prev) => ({ ...prev, source: value }))}>
                    <SelectTrigger className="rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/70">
                      <SelectValue placeholder="Lead source" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadSources.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timeline</Label>
                  <Select value={form.timeline} onValueChange={(value) => setForm((prev) => ({ ...prev, timeline: value }))}>
                    <SelectTrigger className="rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/70">
                      <SelectValue placeholder="Timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadTimelines.map((range) => (
                        <SelectItem key={range} value={range}>
                          {range}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Location focus</Label>
                  <Input
                    value={form.location}
                    onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                    placeholder="Austin, TX"
                    className="rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Budget band</Label>
                  <Input
                    value={form.budget}
                    onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))}
                    placeholder="$750k - $1M"
                    className="rounded-2xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Relocating from Seattle, wants modern lakefront with home office."
                  className="min-h-[120px] rounded-3xl"
                />
              </div>
              <Button
                type="submit"
                variant="gradient"
                className="w-full rounded-3xl py-3 text-base font-bold text-white shadow-purple-glow hover:shadow-purple-glow-sm hover:scale-[1.02] transition-all duration-200"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Qualify instantly
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-text-primary">Pipeline preview</CardTitle>
              <CardDescription className="text-text-tertiary">
                {orderedLeads.length} luxury prospects staged for AI follow-up.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="rounded-2xl">
                {orderedLeads.filter((lead) => lead.score >= 85).length} hot
              </Badge>
              <Badge variant="outline" className="rounded-2xl border-purple-500/30">
                Demo Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="max-h-[540px] pr-6">
              <AnimatePresence>
                {orderedLeads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="mb-4 rounded-3xl border border-purple-500/20 bg-surface-dark/50 p-5 shadow-elevation-1 hover:shadow-purple-glow-sm transition-all duration-300"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-text-primary">{lead.name}</h3>
                          <Badge variant="success" className="rounded-2xl">
                            {lead.status}
                          </Badge>
                          <Badge className="rounded-2xl premium-gradient text-white shadow-purple-glow-sm">
                            {lead.score}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-text-tertiary">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-purple-400" />
                            {lead.location}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarRange className="h-4 w-4 text-purple-400" />
                            {lead.timeline}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="h-4 w-4 text-purple-400" />
                            Last touch {lead.lastContact}
                          </span>
                        </div>
                        <p className="max-w-2xl text-sm text-text-secondary">{lead.notes}</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button
                          variant="outline"
                          className="rounded-2xl border-purple-500/30 hover:border-purple-500/50 hover:text-purple-300"
                          onClick={() => handleFollowUp(lead.id)}
                        >
                          <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
                          Follow up
                        </Button>
                        <Button
                          variant="subtle"
                          className="rounded-2xl border border-transparent bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                          onClick={() => handleSendText(lead.id)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send text
                        </Button>
                        <Button
                          variant="default"
                          className="rounded-2xl premium-gradient text-white shadow-purple-glow-sm hover:shadow-purple-glow"
                          onClick={() => setSchedulingLeadId(lead.id)}
                        >
                          <Timer className="mr-2 h-4 w-4" />
                          Schedule Auto
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-2xl border-purple-500/30 hover:bg-surface-medium"
                          onClick={() => openEditDialog(lead.id)}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          className="rounded-2xl text-rose-400 hover:bg-rose-500/20 sm:col-span-2"
                          onClick={() => handleDeleteLead(lead.id, lead.name)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-tertiary">
                      {lead.email && (
                        <span className="inline-flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          {lead.email}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="inline-flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {lead.phone}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        {lead.source}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editingLeadId !== null} onOpenChange={(open) => (!open ? setEditingLeadId(null) : null)}>
        <DialogContent className="rounded-3xl border-purple-500/30 glass-surface">
          <DialogHeader>
            <DialogTitle className="text-text-primary">Edit lead</DialogTitle>
            <DialogDescription className="text-text-tertiary">Tune the story for your walkthrough.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editingForm.name} onChange={(event) => setEditingForm((prev) => ({ ...prev, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editingForm.email} onChange={(event) => setEditingForm((prev) => ({ ...prev, email: event.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={editingForm.phone} onChange={(event) => setEditingForm((prev) => ({ ...prev, phone: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={editingForm.location} onChange={(event) => setEditingForm((prev) => ({ ...prev, location: event.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Budget</Label>
                <Input value={editingForm.budget} onChange={(event) => setEditingForm((prev) => ({ ...prev, budget: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Timeline</Label>
                <Select value={editingForm.timeline} onValueChange={(value) => setEditingForm((prev) => ({ ...prev, timeline: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadTimelines.map((timeline) => (
                      <SelectItem key={timeline} value={timeline}>
                        {timeline}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editingForm.notes}
                onChange={(event) => setEditingForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingLeadId(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLead} className="rounded-2xl">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={followUpOpen} onOpenChange={(open) => {
        setFollowUpOpen(open);
        if (!open) {
          clearFollowUpDraft();
        }
      }}>
        <DialogContent className="rounded-3xl border-purple-500/30 glass-surface">
          <DialogHeader>
            <DialogTitle className="text-text-primary">{selectedLeadName ? `Follow-up for ${selectedLeadName}` : "AI follow-up"}</DialogTitle>
            <DialogDescription className="text-text-tertiary">Copy, tweak, and send. This message also feeds into the concierge tab.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={followUpDraft?.content ?? ""}
            className="min-h-[200px] rounded-3xl"
            readOnly
          />
          <DialogFooter>
            <Button
              onClick={() => {
                if (!followUpDraft?.leadId) return;
                handleSendText(followUpDraft.leadId);
                clearFollowUpDraft();
                setFollowUpOpen(false);
              }}
              className="rounded-2xl"
            >
              Push to chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
              <Timer className="h-5 w-5 text-purple-400" />
              Automated Follow-Ups
            </CardTitle>
            <CardDescription className="text-text-tertiary">
              Schedule AI-powered follow-ups to keep leads engaged automatically.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-tertiary">Automation</span>
            <Button
              variant={automationEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setAutomationEnabled(!automationEnabled);
                toast(automationEnabled ? "Automation disabled" : "Automation enabled", {
                  description: automationEnabled
                    ? "Scheduled follow-ups are paused."
                    : "Automated follow-ups are now active.",
                });
              }}
              className="rounded-xl"
            >
              {automationEnabled ? (
                <>
                  <Play className="mr-2 h-4 w-4" /> Active
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-4 w-4" /> Paused
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {scheduledFollowUps.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-purple-500/30 bg-surface-dark/50 p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30">
                <Zap className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-sm font-semibold text-text-primary mb-2">No scheduled follow-ups</p>
              <p className="text-xs text-text-tertiary mb-4">
                Click &quot;Schedule Follow-Up&quot; on any lead to set up automated messaging.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[480px] pr-4">
              <AnimatePresence>
                {scheduledFollowUps.map((followUp) => {
                  const isOverdue = new Date() > followUp.scheduledFor && followUp.status === "pending";
                  const timeUntil = followUp.scheduledFor.getTime() - new Date().getTime();
                  const hoursUntil = Math.ceil(timeUntil / (1000 * 60 * 60));
                  const daysUntil = Math.ceil(timeUntil / (1000 * 60 * 60 * 24));

                  return (
                    <motion.div
                      key={followUp.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="mb-4 rounded-3xl border border-purple-500/20 bg-surface-dark/50 p-5 shadow-elevation-1 hover:shadow-purple-glow-sm transition-all duration-300"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-text-primary">{followUp.leadName}</h3>
                            <Badge
                              variant={followUp.status === "sent" ? "success" : isOverdue ? "destructive" : "outline"}
                              className="rounded-2xl"
                            >
                              {followUp.status === "sent" ? "Sent" : isOverdue ? "Overdue" : "Scheduled"}
                            </Badge>
                            <Badge variant="subtle" className="rounded-2xl text-purple-400 border-purple-500/30">
                              {followUp.delay}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-purple-400" />
                              {followUp.scheduledFor.toLocaleDateString()}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3 text-purple-400" />
                              {followUp.scheduledFor.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            </span>
                            {followUp.status === "pending" && !isOverdue && (
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                {daysUntil > 0
                                  ? `${daysUntil} day${daysUntil > 1 ? "s" : ""}`
                                  : `${hoursUntil} hour${hoursUntil > 1 ? "s" : ""}`}{" "}
                                until send
                              </span>
                            )}
                          </div>
                          {followUp.message && (
                            <p className="text-sm text-text-secondary line-clamp-2">{followUp.message}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {followUp.status === "pending" && automationEnabled && (
                            <Button
                              variant="gradient"
                              size="sm"
                              onClick={() => sendScheduledFollowUp(followUp.id)}
                              className="rounded-2xl"
                            >
                              <Send className="mr-2 h-4 w-4" /> Send Now
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelScheduledFollowUp(followUp.id)}
                            className="rounded-2xl text-rose-400 hover:bg-rose-500/20"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={schedulingLeadId !== null} onOpenChange={(open) => (!open ? setSchedulingLeadId(null) : null)}>
        <DialogContent className="rounded-3xl border-purple-500/30 glass-surface">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Schedule Automated Follow-Up
              {schedulingLeadId && ` for ${leads.find((l) => l.id === schedulingLeadId)?.name}`}
            </DialogTitle>
            <DialogDescription className="text-text-tertiary">
              Choose when to automatically send a follow-up message to this lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Send after</Label>
              <Select value={scheduleDelay} onValueChange={setScheduleDelay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 hour">1 hour</SelectItem>
                  <SelectItem value="4 hours">4 hours</SelectItem>
                  <SelectItem value="1 day">1 day</SelectItem>
                  <SelectItem value="2 days">2 days</SelectItem>
                  <SelectItem value="3 days">3 days</SelectItem>
                  <SelectItem value="1 week">1 week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-text-tertiary">
              The AI will generate a personalized follow-up message based on the lead&apos;s information and send it
              automatically at the scheduled time.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSchedulingLeadId(null)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                if (schedulingLeadId) {
                  scheduleAutomatedFollowUp(schedulingLeadId, scheduleDelay);
                  setSchedulingLeadId(null);
                  setScheduleDelay("1 hour");
                }
              }}
              className="rounded-2xl"
            >
              <Timer className="mr-2 h-4 w-4" /> Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


