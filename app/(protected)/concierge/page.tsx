"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, MessageSquarePlus, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useSampleMode } from "@/components/sample-mode-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

type Client = {
  id: string;
  name: string;
  stage: string | null;
  last_message: string | null;
  next_action: string | null;
};

type ConversationMessage = {
  id: string;
  sender: "agent" | "client" | "ai";
  content: string;
  created_at: string;
};

const fetchClients = async (): Promise<Client[]> => {
  const response = await fetch("/api/clients");
  if (!response.ok) {
    throw new Error("Unable to load clients");
  }
  const data = (await response.json()) as { clients: Client[] };
  return data.clients;
};

const fetchMessages = async (clientId: string): Promise<ConversationMessage[]> => {
  const response = await fetch(`/api/messages?clientId=${clientId}`);
  if (!response.ok) {
    throw new Error("Unable to load messages");
  }
  const data = (await response.json()) as { messages: ConversationMessage[] };
  return data.messages;
};

export default function ConciergePage() {
  const queryClient = useQueryClient();
  const {
    isSampleMode,
    conversations: sampleConversations,
    openConversation,
    appendConversationMessage,
    injectClientConversationMessage,
  } = useSampleMode();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
    enabled: !isSampleMode,
  });

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [aiTyping, setAiTyping] = useState(false);

  const sampleClientGroups = useMemo(() => {
    if (!isSampleMode) return null;
    const groups: Record<string, Array<{ id: string; name: string; stage: string; lastMessage: string }>> = {
      Active: [],
      Closing: [],
      Closed: [],
    };
    sampleConversations.forEach((conversation, index) => {
      const stage = index % 3 === 0 ? "Active" : index % 3 === 1 ? "Closing" : "Closed";
      groups[stage].push({
        id: conversation.id,
        name: conversation.clientName,
        stage,
        lastMessage: conversation.summary,
      });
    });
    return groups;
  }, [isSampleMode, sampleConversations]);

  useEffect(() => {
    if (isSampleMode && sampleConversations.length && !selectedConversationId) {
      setSelectedConversationId(sampleConversations[0].id);
      openConversation(sampleConversations[0].id);
    }
  }, [isSampleMode, openConversation, sampleConversations, selectedConversationId]);

  const messagesQuery = useQuery({
    queryKey: ["messages", selectedConversationId],
    queryFn: () => fetchMessages(selectedConversationId ?? ""),
    enabled: Boolean(selectedConversationId) && !isSampleMode,
    refetchInterval: false,
  });

  const selectedSampleConversation = useMemo(() => {
    if (!isSampleMode) return null;
    return sampleConversations.find((conversation) => conversation.id === selectedConversationId) ?? null;
  }, [isSampleMode, sampleConversations, selectedConversationId]);

  const selectedClient = useMemo(() => {
    if (isSampleMode) {
      if (!selectedSampleConversation) return null;
      return {
        id: selectedSampleConversation.id,
        name: selectedSampleConversation.clientName,
        stage: "Active",
        last_message: selectedSampleConversation.summary,
        next_action: "Schedule design reveal",
      } satisfies Client;
    }
    return clients?.find((client) => client.id === selectedConversationId) ?? null;
  }, [clients, isSampleMode, selectedSampleConversation, selectedConversationId]);

  const stageGroups = useMemo((): Record<string, (Client | { id: string; name: string; stage: string; lastMessage: string })[]> | null => {
    if (isSampleMode) return sampleClientGroups;
    const groups: Record<string, Client[]> = {
      Active: [],
      Closing: [],
      Closed: [],
    };
    (clients ?? []).forEach((client) => {
      const stage = client.stage ?? "Active";
      (groups[stage] ?? (groups[stage] = [])).push(client);
    });
    return groups;
  }, [clients, isSampleMode, sampleClientGroups]);

  const conversationMessages = useMemo(() => {
    if (isSampleMode) {
      if (!selectedSampleConversation) return [];
      return selectedSampleConversation.messages.map((message, index) => ({
        id: message.id,
        sender: message.sender === "assistant" ? ("client" as const) : message.sender === "agent" ? ("agent" as const) : ("client" as const),
        content: message.body,
        created_at: message.timestamp,
        index,
      }));
    }
    return messagesQuery.data ?? [];
  }, [isSampleMode, messagesQuery.data, selectedSampleConversation]);

  const generateFollowUp = useMutation({
    mutationFn: async (type: "message" | "reviewRequest" | "referral") => {
      if (!selectedClient) throw new Error("Select a client first");
      if (isSampleMode) {
        setAiTyping(true);
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            if (type === "reviewRequest") {
              resolve(`Hi ${selectedClient.name.split(" ")[0]}, thrilled we crossed the finish line together. Would you mind sharing a quick 5-star review while the experience is fresh?`);
            } else if (type === "referral") {
              resolve(`Hi ${selectedClient.name.split(" ")[0]}, thanks again for trusting us. If anyone in your circle is planning a move this year, I would love to give them the same VIP experience.`);
            } else {
              resolve(`Hey ${selectedClient.name.split(" ")[0]}, just confirmed access for Saturday's architect walkthrough. Shall I lock in transportation and refreshments?`);
            }
          }, 900);
        });
      }

      const response = await fetch("/api/ai/client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName: selectedClient.name,
          stage: selectedClient.stage ?? "Active",
          agentName: "You",
          type: type === "referral" ? "referralFollowup" : type === "reviewRequest" ? "reviewRequest" : "message",
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Unable to generate message");
      }
      const payload = (await response.json()) as { message: string };
      return payload.message;
    },
    onSuccess: (message) => {
      setAiTyping(false);
      setDraft(message);
      if (isSampleMode && selectedConversationId) {
        appendConversationMessage(selectedConversationId, message, "agent");
      }
      toast.success("AI message drafted", { description: "Review and personalize before sending." });
    },
    onError: (error: unknown) => {
      setAiTyping(false);
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Unable to generate message", { description: message });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversationId || !selectedClient) throw new Error("Select a client first");
      if (isSampleMode) {
        appendConversationMessage(selectedConversationId, draft, "agent");
        setDraft("");
        toast.success("Message sent", { description: `${selectedClient.name} notified via concierge.` });
        
        // Auto-generate varied client chatbot responses
        setAiTyping(true);
        const responses = [
          "Thanks for the update! Looking forward to it.",
          "Sounds great! I'll be there.",
          "Perfect, that works for me.",
          "Thanks for keeping me in the loop!",
          "Appreciate the heads up!",
          "Got it, thanks!",
          "That sounds perfect, thank you!",
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        setTimeout(() => {
          setAiTyping(false);
          injectClientConversationMessage(selectedConversationId, randomResponse);
          toast("Client replied", { description: `${selectedClient.name} responded automatically.` });
        }, 1500);
        return;
      }

      const messageContent = draft;
      setDraft("");
      
      const response = await fetch("/api/ai/client-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedConversationId,
          message: messageContent,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to send message");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      setAiTyping(true);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          aiResponse += chunk;

          const tempId = `temp-ai-${Date.now()}`;
          
          const tempMessage: ConversationMessage = {
            id: tempId,
            sender: "client", // AI responses appear as client messages
            content: aiResponse,
            created_at: new Date().toISOString(),
          };

          queryClient.setQueryData(
            ["messages", selectedConversationId],
            (old: ConversationMessage[] | undefined) => {
              const existing = old ?? [];
              const filtered = existing.filter((m) => m.id !== tempId);
              return [...filtered, tempMessage];
            },
          );
        }
      } finally {
        setAiTyping(false);
        queryClient.invalidateQueries({ queryKey: ["messages", selectedConversationId] });
      }

      toast.success("Message sent", { description: "AI response generated." });
    },
    onError: (error: unknown) => {
      setAiTyping(false);
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Unable to send message", { description: message });
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary bg-clip-text text-transparent premium-gradient">Client Concierge</h1>
          <p className="text-sm text-text-tertiary mt-2">Maintain white-glove communication with AI-crafted updates and requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg text-text-primary">Client roster</CardTitle>
            <CardDescription className="text-text-tertiary">Select a client to view the AI conversation workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading && !isSampleMode ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="h-14 animate-pulse rounded-2xl bg-surface-medium" />
                ))}
              </div>
            ) : stageGroups ? (
              Object.entries(stageGroups).map(([stage, list]) => (
                <div key={stage}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{stage}</p>
                  <div className="mt-2 space-y-2">
                    {list.map((client: Client | { id: string; name: string; stage: string; lastMessage: string }) => {
                      const active = client.id === selectedConversationId;
                      return (
                        <motion.button
                          key={client.id}
                          onClick={() => {
                            setSelectedConversationId(client.id);
                            if (isSampleMode) openConversation(client.id);
                          }}
                          className={cn(
                            "w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                            active
                              ? "border-purple-500/40 bg-purple-500/20 text-purple-300 shadow-purple-glow-sm"
                              : "border-purple-500/20 bg-surface-dark/50 text-text-secondary hover:bg-surface-medium hover:border-purple-500/30 hover:text-text-primary",
                          )}
                          whileHover={{ x: 3 }}
                        >
                          <p className="text-sm font-semibold">{client.name ?? ("name" in client ? String(client.name) : "Unknown")}</p>
                          <p className="text-xs text-text-tertiary">{("last_message" in client ? client.last_message : "lastMessage" in client ? client.lastMessage : null) ?? "No recent updates"}</p>
                        </motion.button>
                      );
                    })}
                    {!list.length && <p className="text-xs text-text-tertiary">No clients in this stage.</p>}
                  </div>
                </div>
              ))
            ) : null}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg text-text-primary">{selectedClient?.name ?? "Select a client"}</CardTitle>
              <CardDescription className="text-text-tertiary">
                {selectedClient ? `Stage: ${selectedClient.stage ?? "Active"}` : "Choose a client to load the concierge workspace."}
              </CardDescription>
            </div>
            {selectedClient && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => generateFollowUp.mutate("message")} disabled={generateFollowUp.isPending} className="rounded-xl">
                  <Sparkles className="mr-2 h-4 w-4" /> Follow up
                </Button>
                <Button size="sm" variant="outline" onClick={() => generateFollowUp.mutate("reviewRequest")} disabled={generateFollowUp.isPending} className="rounded-xl">
                  <MessageSquarePlus className="mr-2 h-4 w-4" /> Review request
                </Button>
                <Button size="sm" variant="outline" onClick={() => generateFollowUp.mutate("referral")} disabled={generateFollowUp.isPending} className="rounded-xl">
                  <MessageSquarePlus className="mr-2 h-4 w-4" /> Referral
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex h-[540px] flex-col gap-4">
            <ScrollArea className="flex-1 rounded-2xl border border-purple-500/20 bg-surface-dark/50 p-4">
              <div className="space-y-3">
                {aiTyping && (
                  <TypingBubble clientName={selectedClient?.name ?? "Client"} />
                )}
                {conversationMessages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn("flex", message.sender === "agent" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                        message.sender === "agent"
                          ? "rounded-br-sm premium-gradient text-white shadow-purple-glow-sm"
                          : "rounded-bl-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/30", // Client messages (including AI-generated)
                      )}
                    >
                      {message.content}
                      <p className="mt-2 text-[10px] uppercase tracking-wide text-text-tertiary">
                        {new Date(message.created_at ?? Date.now()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {!conversationMessages.length && (
                  <p className="py-10 text-center text-sm text-text-tertiary">No messages yet. Generate an AI update to get started.</p>
                )}
              </div>
            </ScrollArea>

            <div className="rounded-2xl border border-purple-500/20 bg-surface-dark/50 p-4">
              <Textarea
                placeholder={selectedClient ? "Type a message or generate one with AI" : "Select a client to start"}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={!selectedClient}
                className="min-h-[120px]"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <Input
                  type="text"
                  placeholder="Next action"
                  value={selectedClient?.next_action ?? ""}
                  disabled
                  className="w-48 rounded-xl bg-surface-medium text-xs text-text-tertiary"
                />
                <Button
                  variant="gradient"
                  onClick={() => sendMutation.mutate()}
                  disabled={!draft.trim() || !selectedClient || sendMutation.isPending}
                  className="rounded-2xl px-5 shadow-purple-glow-sm"
                >
                  {sendMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send text
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TypingBubble({ clientName }: { clientName: string }) {
  const firstName = clientName.split(" ")[0];
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
        {firstName[0]}
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-emerald-500/20 px-3 py-2 border border-emerald-500/30">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" style={{ animationDelay: "150ms" }} />
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}


