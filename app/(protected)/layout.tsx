import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Use default user if no session
  let user = {
    id: "demo-user",
    email: "demo@example.com",
    name: "Demo Agent",
    openaiApiKey: null as string | null,
  };

  let assistantHistory: Array<{
    id: string;
    sender: "agent" | "ai";
    content: string;
    created_at: string;
  }> = [];

  // If session exists, try to load user data
  if (session?.user) {
    try {
      const { data: profile } = await supabase
        .from("users")
        .select("id, name, email, openai_api_key")
        .eq("id", session.user.id)
        .single();

      const { data: history } = await supabase
        .from("messages")
        .select("id, sender, content, created_at")
        .eq("user_id", session.user.id)
        .is("client_id", null)
        .order("created_at", { ascending: true })
        .limit(30);

      user = {
        id: session.user.id,
        email: session.user.email ?? profile?.email ?? "demo@example.com",
        name: profile?.name ?? session.user.user_metadata.full_name ?? "Agent",
        openaiApiKey: profile?.openai_api_key ?? null,
      };

      assistantHistory = history ?? [];
    } catch (error) {
      // Fallback to session data if database query fails
      console.warn("[protected-layout] database query failed, using session data", error);
      user = {
        id: session.user.id,
        email: session.user.email ?? "demo@example.com",
        name: session.user.user_metadata.full_name ?? "Agent",
        openaiApiKey: null,
      };
      assistantHistory = [];
    }
  }

  return (
    <AppShell
      user={user}
      assistantHistory={assistantHistory}
    >
      {children}
    </AppShell>
  );
}


