"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MessageCircle, Send, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { useSampleMode } from "@/components/sample-mode-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DemoProperty } from "@/lib/sampleData";

type AssistantMessage = {
  id: string;
  sender: "agent" | "ai";
  content: string;
  created_at?: string;
  propertyImage?: string;
};

type AssistantWidgetProps = {
  initialMessages: AssistantMessage[];
};

export function AssistantWidget({ initialMessages }: AssistantWidgetProps) {
  const { propertyLibrary } = useSampleMode();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const placeholder = useMemo(
    () =>
      [
        "Summarize today's hot leads.",
        "Draft a nurture plan for Monarch Ridge buyers.",
        "What should I prioritize this afternoon?",
        "Show me a property image",
        "Display a luxury listing",
        "I want to see a property",
      ][Math.floor(Math.random() * 6)],
    [],
  );

  const detectPropertyRequest = (message: string): { image: string | null; property: DemoProperty | null } => {
    const lowerMessage = message.toLowerCase();
    const propertyKeywords = [
      "property", "listing", "home", "house", "estate", 
      "show me", "property image", "property photo", "property picture",
      "see a property", "show property", "display property",
      "real estate", "luxury home", "show listing", "property",
      "estate", "home", "house", "listing"
    ];
    const hasPropertyKeyword = propertyKeywords.some((keyword) => lowerMessage.includes(keyword));
    
    if (hasPropertyKeyword && propertyLibrary.length > 0) {
      // Return a random property from the library
      const randomProperty = propertyLibrary[Math.floor(Math.random() * propertyLibrary.length)];
      return { 
        image: randomProperty?.image || null,
        property: randomProperty || null
      };
    }
    return { image: null, property: null };
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    const optimisticMessage: AssistantMessage = {
      id: crypto.randomUUID(),
      sender: "agent",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    
    // Check if this is a property request
    const { image: propertyImage, property: detectedProperty } = detectPropertyRequest(trimmed);
    
    // Create a property-aware response prefix if property detected
    let propertyResponsePrefix = "";
    if (detectedProperty && propertyImage) {
      propertyResponsePrefix = `Here's a beautiful property for you: ${detectedProperty.title || "Luxury Estate"} at ${detectedProperty.address || "Premium Location"}. `;
    }
    
    setMessages((prev) => [...prev, optimisticMessage, { 
      id: "pending", 
      sender: "ai", 
      content: propertyResponsePrefix, 
      created_at: new Date().toISOString(), 
      propertyImage: propertyImage || undefined 
    }]);
    setInput("");

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to generate assistant response");
      }

      if (!response.body) {
        const data = (await response.json()) as { message: string };
        setMessages((prev) => prev.map((msg) => 
          msg.id === "pending" 
            ? { ...msg, id: crypto.randomUUID(), content: data.message, propertyImage: propertyImage || undefined } 
            : msg
        ));
      } else {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          assistantText += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((msg) => (msg.id === "pending" ? { ...msg, content: assistantText, propertyImage: propertyImage || undefined } : msg)),
          );
        }

        setMessages((prev) =>
          prev.map((msg) => (msg.id === "pending" ? { ...msg, id: crypto.randomUUID(), content: assistantText.trim(), propertyImage: propertyImage || undefined } : msg)),
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Assistant unavailable", { description: message });
      setMessages((prev) => prev.filter((msg) => msg.id !== "pending"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <motion.div
        initial={false}
        animate={{ scale: open ? 0 : 1, opacity: open ? 0 : 1 }}
        className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6"
      >
        <Button size="lg" className="rounded-full px-4 py-4 sm:px-6 sm:py-6 shadow-xl shadow-blue-500/40" onClick={() => setOpen(true)}>
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
          <span className="hidden sm:inline">AI Assistant</span>
        </Button>
      </motion.div>

      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0, y: open ? 0 : 20, pointerEvents: open ? "auto" : "none" }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="fixed bottom-4 right-4 left-4 z-40 w-auto max-w-md sm:left-auto sm:bottom-6 sm:right-6"
      >
        <Card className={cn("overflow-hidden border-purple-500/30 shadow-purple-glow", open ? "pointer-events-auto" : "pointer-events-none")}>
          <CardHeader className="flex items-center justify-between premium-gradient text-white">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <MessageCircle className="h-4 w-4" />
              Growth Copilot
            </CardTitle>
            <button className="rounded-full p-1 transition hover:bg-white/10" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-0 bg-surface-dark">
            <ScrollArea className="h-64 sm:h-80 px-4 sm:px-6 py-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="rounded-2xl bg-purple-500/10 border border-purple-500/30 p-3 sm:p-4 text-xs sm:text-sm text-purple-300">
                    Ask me for growth insights, draft follow-ups, or show me a property image.
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={cn("flex", message.sender === "agent" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm shadow-sm",
                        message.sender === "agent"
                          ? "rounded-br-sm premium-gradient text-white shadow-purple-glow-sm"
                          : "rounded-bl-sm bg-surface-medium text-text-secondary border border-purple-500/20",
                      )}
                    >
                      {message.content || <span className="text-text-tertiary">Thinking...</span>}
                      {message.propertyImage && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-purple-500/30">
                          <div className="relative w-full aspect-video bg-surface-medium">
                            <Image
                              src={message.propertyImage}
                              alt="Property listing"
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 85vw, 400px"
                              unoptimized={message.propertyImage.includes("unsplash.com")}
                            />
                          </div>
                          <div className="p-2 bg-purple-500/10 text-xs text-purple-300 flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            <span>Property Image</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t border-purple-500/20 bg-surface-dark px-4 sm:px-6 py-3 sm:py-4">
              <Textarea
                placeholder={placeholder}
                value={input}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                onChange={(event) => setInput(event.target.value)}
                className="min-h-[60px] sm:min-h-[80px] text-sm resize-none"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setInput("")} disabled={!input} className="text-xs sm:text-sm">
                  Clear
                </Button>
                <Button onClick={handleSend} disabled={isSending || !input.trim()} className="text-xs sm:text-sm">
                  {isSending ? <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <Send className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />}
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}


