"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  Gauge,
  Handshake,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { useSampleMode } from "@/components/sample-mode-provider";
import { AssistantWidget } from "@/components/surfaces/assistant-widget";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", description: "Command center overview", icon: <Gauge className="h-5 w-5" /> },
  { label: "Lead Engine", href: "/lead-engine", description: "Qualify and activate leads", icon: <Target className="h-5 w-5" /> },
  { label: "Marketing", href: "/marketing", description: "Campaign generator", icon: <Megaphone className="h-5 w-5" /> },
  { label: "Deal Desk", href: "/deal-desk", description: "Contracts & tasking", icon: <Handshake className="h-5 w-5" /> },
  { label: "Concierge", href: "/concierge", description: "Client concierge hub", icon: <Sparkles className="h-5 w-5" /> },
  { label: "Settings", href: "/settings", description: "Integrations & preferences", icon: <Settings className="h-5 w-5" /> },
  { label: "Demo", href: "/demo", description: "Lead to appointment demo", icon: <Zap className="h-5 w-5" /> },
];

type AssistantHistoryItem = {
  id: string;
  sender: "agent" | "ai";
  content: string;
  created_at: string;
};

type AppShellProps = {
  user: {
    id: string;
    name: string;
    email: string;
    openaiApiKey: string | null;
  };
  assistantHistory: AssistantHistoryItem[];
  children: React.ReactNode;
};

export function AppShell({ user, assistantHistory, children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    isSampleMode,
    chat,
    resetDemoData,
  } = useSampleMode();

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    // Refresh the page to reset state
    window.location.href = "/dashboard";
  };

  const assistantMessages = useMemo(() => {
    if (isSampleMode && chat.length) {
      return chat.map((message, index) => ({
        id: `sample-assistant-${index}`,
        sender: message.role === "assistant" ? ("ai" as const) : ("agent" as const),
        content: message.content,
        created_at: new Date(Date.now() - (chat.length - index) * 60_000).toISOString(),
      }));
    }
    return assistantHistory;
  }, [assistantHistory, chat, isSampleMode]);

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl premium-gradient text-white shadow-purple-glow-sm">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">AI Growth System</p>
            <p className="text-xs text-text-tertiary">Real estate command center</p>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <motion.div
                  whileHover={{ x: 4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200",
                    active
                      ? "bg-purple-500/20 text-text-primary shadow-purple-glow-sm border border-purple-500/30"
                      : "text-text-secondary hover:bg-surface-medium hover:text-text-primary hover:border-purple-500/10 border border-transparent",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200",
                      active
                        ? "border-purple-500/40 text-purple-400 bg-purple-500/10 shadow-purple-glow-sm"
                        : "border-purple-500/10 text-text-tertiary bg-surface-dark group-hover:border-purple-500/30 group-hover:text-purple-400",
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className="text-xs text-text-tertiary">{item.description}</span>
                  </div>
                  {active && <CheckCircle2 className="h-4 w-4 text-purple-400" />}
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="glass-surface rounded-2xl p-4 border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="border-2 border-purple-500/30">
            <AvatarFallback className="bg-purple-500/20 text-purple-300">{initials || "AG"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-text-primary">{user.name}</p>
            <p className="text-xs text-text-tertiary">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant={user.openaiApiKey ? "success" : "outline"} className="rounded-xl">
            {user.openaiApiKey ? "Live AI" : "Demo AI"}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-text-tertiary hover:text-text-primary">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r border-purple-500/20 glass-surface px-4 py-8 xl:flex">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className="fixed inset-y-0 left-0 z-40 w-64 border-r border-purple-500/20 glass-surface px-4 py-8 xl:hidden"
          >
            <Button variant="ghost" size="sm" className="mb-8 px-0 text-sm text-text-tertiary hover:text-text-primary" onClick={() => setSidebarOpen(false)}>
              Close
            </Button>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex w-full flex-1 flex-col">
        {isSampleMode && (
          <div className="flex items-center justify-center gap-3 bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-sm font-medium text-amber-300">
            <span>🧪 Demo Mode Active — all pipeline data is simulated.</span>
            <Button size="sm" variant="ghost" className="rounded-xl border border-amber-500/40 text-amber-300 hover:bg-amber-500/20" onClick={() => {
              resetDemoData();
              toast.success("Demo reset", { description: "Sample data refreshed." });
            }}>
              Reset demo
            </Button>
          </div>
        )}

        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-4 !border-0" style={{ background: 'transparent', border: 'none !important', boxShadow: 'none' }}>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="xl:hidden text-text-secondary hover:text-text-primary" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm font-bold text-text-primary">AI Real Estate Growth System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-xl px-3 py-1 text-xs text-text-secondary border-purple-500/30">
              {isSampleMode ? "Demo Mode" : user.openaiApiKey ? "Operational" : "Setup"}
            </Badge>
          </div>
        </header>

        <div className="relative flex-1 px-6 pb-24 pt-2">
          <div className="mx-auto max-w-6xl space-y-8">{children}</div>
        </div>
      </main>

      <AssistantWidget initialMessages={assistantMessages} />
    </div>
  );
}


