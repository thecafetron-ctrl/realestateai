"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  demoConversationLibrary,
  demoDealsHistory,
  demoDocumentLibrary,
  demoInsight,
  demoLeadLibrary,
  demoNotifications,
  demoPropertyLibrary,
  DemoConversation,
  DemoDeal,
  DemoDocument,
  DemoLead,
  DemoNotification,
  DemoProperty,
} from "@/lib/sampleData";

type LegacyPost = {
  platform: string;
  title: string;
  caption: string;
  hashtags: string;
};

type LegacyMessage = {
  sender: string;
  text: string;
};

type LegacyChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SAMPLE_MODE_STORAGE_KEY = "ai-realestate-sample-mode";

type FollowUpDraft = {
  leadId: string;
  content: string;
  generatedAt: string;
};

type SampleModeState = {
  isSampleMode: boolean;
  leads: DemoLead[];
  posts: LegacyPost[];
  messages: LegacyMessage[];
  chat: LegacyChatMessage[];
  documents: DemoDocument[];
  deals: DemoDeal[];
  conversations: DemoConversation[];
  activeConversationId: string | null;
  insight: string;
  notifications: DemoNotification[];
  activeProperty: DemoProperty | null;
  followUpDraft: FollowUpDraft | null;
};

type SampleModeContextValue = SampleModeState & {
  propertyLibrary: DemoProperty[];
  leadLibrary: DemoLead[];
  loadSampleData: () => void;
  clearSampleData: () => void;
  setInsight: (value: string) => void;
  addLeadFromLibrary: () => void;
  createLead: (payload: {
    name: string;
    email?: string;
    phone?: string;
    source: string;
    location: string;
    budget: string;
    timeline: string;
    notes: string;
  }) => void;
  updateLead: (id: string, updates: Partial<DemoLead>) => void;
  deleteLead: (id: string) => void;
  prepareFollowUp: (leadId: string) => void;
  clearFollowUpDraft: () => void;
  openConversation: (id: string) => void;
  appendConversationMessage: (conversationId: string, body: string, sender: "agent" | "assistant") => void;
  injectClientConversationMessage: (conversationId: string, body: string) => void;
  randomizeProperty: () => DemoProperty | null;
  setActiveProperty: (propertyId: string) => void;
  resetActiveProperty: () => void;
  addDocumentPlaceholder: (title: string, property?: string) => DemoDocument;
  removeDocument: (id: string) => void;
  addMarketingAsset: (asset: LegacyPost) => void;
  removeMarketingAsset: (title: string) => void;
  archiveDeal: (id: string) => void;
  resetDemoData: () => void;
  addNotification: (notification: Omit<DemoNotification, "id" | "timestamp"> & { timestamp?: string }) => void;
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const adjustScore = (score: number) => {
  const variation = Math.floor(Math.random() * 10) - 5;
  return Math.max(55, Math.min(99, score + variation));
};

const cloneConversation = (conversation: DemoConversation): DemoConversation => ({
  ...conversation,
  messages: conversation.messages.map((message) => ({ ...message })),
});

const propertyLibrary = demoPropertyLibrary.map((property) => ({
  ...property,
  gallery: [...property.gallery],
}));

const leadLibrary = demoLeadLibrary.map((lead) => ({ ...lead }));

const buildMarketingPosts = (): LegacyPost[] =>
  propertyLibrary.slice(0, 4).map((property, index) => ({
    platform: index % 2 === 0 ? "Instagram" : "LinkedIn",
    title: property.title,
    caption: `${property.address} just hit the market. ${property.description}`,
    hashtags: "#LuxuryRealEstate #AIConcierge #DemoMode",
  }));

const buildDemoMessages = (): LegacyMessage[] => {
  const primary = demoConversationLibrary[0];
  if (!primary) return [];
  return primary.messages.slice(-4).map((message) => ({
    sender:
      message.sender === "assistant"
        ? "AI Concierge"
        : message.sender === "agent"
          ? "You"
          : primary.clientName,
    text: message.body,
  }));
};

const buildAssistantChat = (): LegacyChatMessage[] => [
  { role: "user", content: "Give me the overnight pipeline pulse." },
  {
    role: "assistant",
    content: "You are tracking 40 luxury leads with 12 ready for outreach, 4 contracts in review, and marketing assets staged for Thursday's blast.",
  },
  { role: "user", content: "Queue fresh follow-ups for the Brentwood and Miami buyers." },
  {
    role: "assistant",
    content: "Follow-ups drafted with concierge tone and synced to the messaging hub. Want me to add a seller nurture too?",
  },
];

const createSampleState = (): Omit<SampleModeState, "isSampleMode"> => ({
  leads: leadLibrary.map((lead) => ({ ...lead })),
  posts: buildMarketingPosts(),
  messages: buildDemoMessages(),
  chat: buildAssistantChat(),
  documents: demoDocumentLibrary.map((doc) => ({ ...doc })),
  deals: demoDealsHistory.map((deal) => ({ ...deal })),
  conversations: demoConversationLibrary.map((conversation) => cloneConversation(conversation)),
  activeConversationId: demoConversationLibrary[0]?.id ?? null,
  insight: demoInsight,
  notifications: demoNotifications.map((notification) => ({ ...notification })),
  activeProperty: propertyLibrary[0] ?? null,
  followUpDraft: null,
});

const defaultState: SampleModeState = {
  isSampleMode: true,
  ...createSampleState(),
};

const emptyState: SampleModeState = {
  isSampleMode: false,
  leads: [],
  posts: [],
  messages: [],
  chat: [],
  documents: [],
  deals: [],
  conversations: [],
  activeConversationId: null,
  insight: "",
  notifications: [],
  activeProperty: propertyLibrary[0] ?? null,
  followUpDraft: null,
};

const SampleModeContext = createContext<SampleModeContextValue | undefined>(undefined);

export function SampleModeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SampleModeState>(defaultState);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const persisted = localStorage.getItem(SAMPLE_MODE_STORAGE_KEY);
      if (!persisted) return;
      const parsed = JSON.parse(persisted) as Partial<SampleModeState>;
      if (parsed?.isSampleMode) {
        setState({
          isSampleMode: true,
          ...createSampleState(),
          ...parsed,
          leads: parsed.leads?.length ? parsed.leads : defaultState.leads,
          posts: parsed.posts ?? defaultState.posts,
          messages: parsed.messages ?? defaultState.messages,
          chat: parsed.chat ?? defaultState.chat,
          documents: parsed.documents ?? defaultState.documents,
          deals: parsed.deals ?? defaultState.deals,
          conversations: (parsed.conversations ?? defaultState.conversations).map((conversation) =>
            cloneConversation(conversation as DemoConversation),
          ),
          activeConversationId: parsed.activeConversationId ?? defaultState.activeConversationId,
          insight: parsed.insight ?? defaultState.insight,
          notifications: parsed.notifications ?? defaultState.notifications,
          activeProperty: parsed.activeProperty ?? defaultState.activeProperty,
          followUpDraft: null,
        });
      } else {
        setState({ ...emptyState, isSampleMode: false });
      }
    } catch (error) {
      console.warn("[sample-mode] failed to parse storage payload", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (state.isSampleMode) {
      localStorage.setItem(SAMPLE_MODE_STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(SAMPLE_MODE_STORAGE_KEY);
    }
  }, [state]);

  useEffect(() => {
    if (!state.isSampleMode) return;
    const isEmpty = !state.leads.length && !state.deals.length && !state.posts.length && !state.documents.length;
    if (isEmpty) {
      setState({
        isSampleMode: true,
        ...createSampleState(),
      });
    }
  }, [state.isSampleMode, state.leads.length, state.deals.length, state.posts.length, state.documents.length]);

  const loadSampleData = useCallback(() => {
    setState({
      isSampleMode: true,
      ...createSampleState(),
    });
  }, []);

  const clearSampleData = useCallback(() => {
    setState({ ...emptyState });
  }, []);

  const setInsight = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      insight: value,
    }));
  }, []);

  const addLeadFromLibrary = useCallback(() => {
    setState((prev) => {
      if (!prev.isSampleMode) {
        return prev;
      }
      const template = leadLibrary[Math.floor(Math.random() * leadLibrary.length)];
      const newLead: DemoLead = {
        ...template,
        id: createId(),
        createdAt: new Date().toISOString(),
        lastContact: "just now",
        status: "Active Lead",
        stage: "New Inquiry",
        score: adjustScore(template.score),
      };
      const notification: DemoNotification = {
        id: createId(),
        title: "Sample lead entered",
        detail: `${newLead.name} arrived via ${newLead.source}.`,
        timestamp: new Date().toISOString(),
      };
      return {
        ...prev,
        leads: [newLead, ...prev.leads],
        notifications: [notification, ...prev.notifications].slice(0, 8),
      };
    });
  }, []);

  const createLead = useCallback(
    (payload: {
      name: string;
      email?: string;
      phone?: string;
      source: string;
      location: string;
      budget: string;
      timeline: string;
      notes: string;
    }) => {
      const newLead: DemoLead = {
        id: createId(),
        name: payload.name,
        email: payload.email ?? "",
        phone: payload.phone ?? "",
        source: payload.source,
        location: payload.location,
        budget: payload.budget,
        status: "Active Lead",
        stage: "Discovery",
        timeline: payload.timeline,
        lastContact: "just now",
        notes: payload.notes,
        score: adjustScore(82),
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        leads: [newLead, ...prev.leads],
      }));
    },
    [],
  );

  const updateLead = useCallback((id: string, updates: Partial<DemoLead>) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead)),
    }));
  }, []);

  const deleteLead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.filter((lead) => lead.id !== id),
    }));
  }, []);

  const prepareFollowUp = useCallback((leadId: string) => {
    setState((prev) => {
      const lead = prev.leads.find((item) => item.id === leadId);
      if (!lead) return prev;
      const firstName = lead.name.split(" ")[0];
      const message = [
        `Hi ${firstName}, just circling back on your search in ${lead.location}.`,
        lead.timeline ? `I penciled in options that match your ${lead.timeline} timeline.` : "",
        lead.notes ? `Highlights from my notes: ${lead.notes}` : "",
        "Let me know if you would like fresh tours or refined comps and I will arrange everything this afternoon.",
      ]
        .filter(Boolean)
        .join(" ");
      return {
        ...prev,
        followUpDraft: {
          leadId,
          content: message,
          generatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const clearFollowUpDraft = useCallback(() => {
    setState((prev) => ({
      ...prev,
      followUpDraft: null,
    }));
  }, []);

  const openConversation = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      activeConversationId: id,
      conversations: prev.conversations.map((conversation) =>
        conversation.id === id ? { ...conversation, unread: false } : conversation,
      ),
    }));
  }, []);

  const appendConversationMessage = useCallback((conversationId: string, body: string, sender: "agent" | "assistant") => {
    const timestamp = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: [...conversation.messages, { id: createId(), sender, body, timestamp }],
            }
          : conversation,
      ),
    }));
  }, []);

  const injectClientConversationMessage = useCallback((conversationId: string, body: string) => {
    const timestamp = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              unread: true,
              messages: [...conversation.messages, { id: createId(), sender: "client", body, timestamp }],
            }
          : conversation,
      ),
    }));
  }, []);

  const randomizeProperty = useCallback(() => {
    if (!propertyLibrary.length) {
      return null;
    }
    const property = propertyLibrary[Math.floor(Math.random() * propertyLibrary.length)];
    setState((prev) => ({
      ...prev,
      activeProperty: property,
    }));
    return property;
  }, []);

  const setActiveProperty = useCallback((propertyId: string) => {
    const property = propertyLibrary.find((item) => item.id === propertyId);
    if (!property) return;
    setState((prev) => ({
      ...prev,
      activeProperty: property,
    }));
  }, []);

  const resetActiveProperty = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeProperty: propertyLibrary[0] ?? null,
    }));
  }, []);

  const addDocumentPlaceholder = useCallback((title: string, property?: string) => {
    const document: DemoDocument = {
      id: createId(),
      title,
      property: property ?? "Demo Upload",
      size: "Processing",
      uploadedAt: new Date().toISOString(),
      status: "processing",
    };
    setState((prev) => ({
      ...prev,
      documents: [document, ...prev.documents],
    }));
    return document;
  }, []);

  const removeDocument = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.filter((document) => document.id !== id),
    }));
  }, []);

  const addMarketingAsset = useCallback((asset: LegacyPost) => {
    setState((prev) => ({
      ...prev,
      posts: [asset, ...prev.posts].slice(0, 50),
    }));
  }, []);

  const removeMarketingAsset = useCallback((title: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.filter((post) => post.title !== title),
    }));
  }, []);

  const archiveDeal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      deals: prev.deals.filter((deal) => deal.id !== id),
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    setState({
      isSampleMode: true,
      ...createSampleState(),
    });
  }, []);

  const addNotification = useCallback(
    (notification: Omit<DemoNotification, "id" | "timestamp"> & { timestamp?: string }) => {
      const item: DemoNotification = {
        id: createId(),
        title: notification.title,
        detail: notification.detail,
        timestamp: notification.timestamp ?? new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        notifications: [item, ...prev.notifications].slice(0, 8),
      }));
    },
    [],
  );

  const value = useMemo(
    () => ({
      ...state,
      propertyLibrary,
      leadLibrary,
      loadSampleData,
      clearSampleData,
      setInsight,
      addLeadFromLibrary,
      createLead,
      updateLead,
      deleteLead,
      prepareFollowUp,
      clearFollowUpDraft,
      openConversation,
      appendConversationMessage,
      injectClientConversationMessage,
      randomizeProperty,
      setActiveProperty,
      resetActiveProperty,
      addDocumentPlaceholder,
      removeDocument,
      addMarketingAsset,
      removeMarketingAsset,
      archiveDeal,
      resetDemoData,
      addNotification,
    }),
    [
      state,
      loadSampleData,
      clearSampleData,
      setInsight,
      addLeadFromLibrary,
      createLead,
      updateLead,
      deleteLead,
      prepareFollowUp,
      clearFollowUpDraft,
      openConversation,
      appendConversationMessage,
      injectClientConversationMessage,
      randomizeProperty,
      setActiveProperty,
      resetActiveProperty,
      addDocumentPlaceholder,
      removeDocument,
      addMarketingAsset,
      removeMarketingAsset,
      archiveDeal,
      resetDemoData,
      addNotification,
    ],
  );

  return <SampleModeContext.Provider value={value}>{children}</SampleModeContext.Provider>;
}

export function useSampleMode() {
  const context = useContext(SampleModeContext);
  if (!context) {
    throw new Error("useSampleMode must be used within a SampleModeProvider");
  }
  return context;
}


