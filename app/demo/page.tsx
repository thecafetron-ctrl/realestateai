"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, User, Zap, Play, RotateCcw, ChevronRight, CheckCircle2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Message = {
  id: string;
  sender: "lead" | "ai" | "system";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
};

type DemoStep = {
  id: string;
  type: "lead_arrival" | "ai_message" | "lead_response" | "booking_confirmed";
  delay: number;
  message?: string;
  leadResponse?: string;
};

const conversationScript: DemoStep[] = [
  {
    id: "1",
    type: "lead_arrival",
    delay: 0,
    message: "New lead from Zillow: Sarah J., budget AED 3M, Dubai Marina.",
  },
  {
    id: "2",
    type: "ai_message",
    delay: 2000,
    message: "Hi Sarah! It's Alex from [Agent Name]. Thanks for reaching out about Dubai Marina townhouses. Are you looking to buy in the next 1–2 months or later?",
  },
  {
    id: "3",
    type: "lead_response",
    delay: 5000,
    leadResponse: "Probably in the next 1–2 months.",
  },
  {
    id: "4",
    type: "ai_message",
    delay: 3000,
    message: "Perfect. Quick one—are you already pre-approved or still exploring financing?",
  },
  {
    id: "5",
    type: "lead_response",
    delay: 5000,
    leadResponse: "Pre-approved.",
  },
  {
    id: "6",
    type: "ai_message",
    delay: 3000,
    message: "Great. Last question: do you prefer something move-in ready or are you open to a light reno?",
  },
  {
    id: "7",
    type: "lead_response",
    delay: 5000,
    leadResponse: "Move-in ready.",
  },
  {
    id: "8",
    type: "ai_message",
    delay: 3000,
    message: "Awesome. I have 3 options that match. Want to see them this week? Here are two slots: Tue 5pm or Wed 11am.",
  },
  {
    id: "9",
    type: "lead_response",
    delay: 6000,
    leadResponse: "Tuesday 5pm works.",
  },
  {
    id: "10",
    type: "ai_message",
    delay: 2000,
    message: "Locked in ✅ You're booked for Tue 5pm. I'll send address + listings shortly. See you then!",
  },
  {
    id: "11",
    type: "booking_confirmed",
    delay: 2000,
  },
];

const leadData = {
  name: "Sarah Johnson",
  source: "Zillow",
  property: "3 bed townhouse in Dubai Marina",
  budget: "AED 2.8–3.2M",
  timeline: "30–60 days",
  email: "sarah.johnson@email.com",
  phone: "+971 50 123 4567",
};

export default function DemoPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const addMessage = (sender: "lead" | "ai" | "system", content: string, showTyping = false) => {
    if (showTyping) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, sender, content, timestamp: new Date() }]);
      }, 1500);
    } else {
      setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, sender, content, timestamp: new Date() }]);
    }
  };

  const executeStep = (step: DemoStep) => {
    switch (step.type) {
      case "lead_arrival":
        addMessage("system", step.message || "");
        break;
      case "ai_message":
        addMessage("ai", step.message || "", true);
        break;
      case "lead_response":
        addMessage("lead", step.leadResponse || "");
        break;
      case "booking_confirmed":
        setBookingConfirmed(true);
        setShowCalendar(true);
        toast.success("Appointment booked!", { description: "Sarah Johnson confirmed for Tuesday 5pm" });
        break;
    }
  };

  const startDemo = () => {
    setMessages([]);
    setCurrentStep(0);
    setIsRunning(true);
    setBookingConfirmed(false);
    setShowCalendar(false);

    let cumulativeDelay = 0;
    conversationScript.forEach((step, index) => {
      cumulativeDelay += step.delay;
      setTimeout(() => {
        executeStep(step);
        setCurrentStep(index + 1);
        if (index === conversationScript.length - 1) {
          setIsRunning(false);
        }
      }, cumulativeDelay);
    });
  };

  const nextStep = () => {
    if (currentStep >= conversationScript.length) {
      toast.info("Demo complete", { description: "Click Reset to start over." });
      return;
    }

    const step = conversationScript[currentStep];
    executeStep(step);
    setCurrentStep((prev) => prev + 1);
  };

  const resetDemo = () => {
    setMessages([]);
    setCurrentStep(0);
    setIsRunning(false);
    setIsTyping(false);
    setBookingConfirmed(false);
    setShowCalendar(false);
  };

  // Calculate next Tuesday 5pm
  const getNextTuesday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilTuesday = dayOfWeek <= 2 ? 2 - dayOfWeek : 9 - dayOfWeek;
    const nextTuesday = new Date(today);
    nextTuesday.setDate(today.getDate() + daysUntilTuesday);
    nextTuesday.setHours(17, 0, 0, 0);
    return nextTuesday;
  };

  const bookingDate = getNextTuesday();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary bg-clip-text text-transparent premium-gradient">
              Lead to Appointment Demo
            </h1>
            <p className="text-sm text-text-tertiary mt-2">
              Interactive simulation of AI-powered lead qualification and booking flow
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="gradient"
              onClick={startDemo}
              disabled={isRunning}
              className="rounded-2xl shadow-purple-glow-sm"
            >
              <Play className="mr-2 h-4 w-4" />
              {isRunning ? "Running..." : "Start Demo"}
            </Button>
            <Button
              variant="outline"
              onClick={nextStep}
              disabled={isRunning || currentStep >= conversationScript.length}
              className="rounded-2xl border-purple-500/30"
            >
              <ChevronRight className="mr-2 h-4 w-4" />
              Next Step
            </Button>
            <Button
              variant="ghost"
              onClick={resetDemo}
              className="rounded-2xl text-text-tertiary hover:text-text-primary"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[380px,1fr,320px]">
          {/* Left: Lead Inbox */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
                <MessageSquare className="h-5 w-5 text-purple-400" />
                Lead Inbox
              </CardTitle>
              <CardDescription className="text-text-tertiary">New lead notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {messages.some((m) => m.sender === "system") && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30">
                        <Zap className="h-5 w-5 text-purple-400" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="success" className="rounded-xl text-xs">New Lead</Badge>
                          <span className="text-xs text-text-tertiary">{formatTime(new Date())}</span>
                        </div>
                        <p className="text-sm font-semibold text-text-primary">{leadData.name}</p>
                        <div className="space-y-1 text-xs text-text-tertiary">
                          <p>
                            <span className="font-medium text-text-secondary">Source:</span> {leadData.source}
                          </p>
                          <p>
                            <span className="font-medium text-text-secondary">Property:</span> {leadData.property}
                          </p>
                          <p>
                            <span className="font-medium text-text-secondary">Budget:</span> {leadData.budget}
                          </p>
                          <p>
                            <span className="font-medium text-text-secondary">Timeline:</span> {leadData.timeline}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Center: AI Conversation */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
                <User className="h-5 w-5 text-purple-400" />
                AI Conversation
              </CardTitle>
              <CardDescription className="text-text-tertiary">
                Real-time messaging with {leadData.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 min-h-[500px] max-h-[600px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={message.sender === "system" ? "hidden" : "flex"}
                    >
                      <div
                        className={message.sender === "ai" ? "flex w-full justify-start" : "flex w-full justify-end"}
                      >
                        <div
                          className={message.sender === "ai"
                            ? "max-w-[75%] rounded-2xl rounded-bl-sm bg-surface-medium text-text-secondary border border-purple-500/20 px-4 py-3"
                            : "max-w-[75%] rounded-2xl rounded-br-sm premium-gradient text-white shadow-purple-glow-sm px-4 py-3"}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className="mt-2 text-[10px] uppercase tracking-wide opacity-70">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-surface-medium border border-purple-500/20 px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-purple-400" />
                        <span
                          className="inline-block h-2 w-2 animate-pulse rounded-full bg-purple-400"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="inline-block h-2 w-2 animate-pulse rounded-full bg-purple-400"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right: Calendar Booking */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
                <Calendar className="h-5 w-5 text-purple-400" />
                Calendar
              </CardTitle>
              <CardDescription className="text-text-tertiary">Appointment scheduling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showCalendar ? (
                <div className="rounded-2xl border border-dashed border-purple-500/30 bg-surface-dark/50 p-8 text-center">
                  <Calendar className="mx-auto mb-3 h-12 w-12 text-text-tertiary opacity-50" />
                  <p className="text-sm text-text-tertiary">No appointments scheduled</p>
                  <p className="text-xs text-text-tertiary mt-1">Waiting for booking confirmation...</p>
                </div>
              ) : (
                <AnimatePresence>
                  {bookingConfirmed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          <span className="text-sm font-semibold text-emerald-300">Booking Confirmed</span>
                        </div>
                        <p className="text-xs text-emerald-200/80">
                          Appointment successfully scheduled and confirmed
                        </p>
                      </div>

                      <div className="rounded-2xl border border-purple-500/20 bg-surface-dark/50 p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/30">
                            <Calendar className="h-5 w-5 text-purple-400" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="text-sm font-semibold text-text-primary">
                                Showing: {leadData.name}
                              </p>
                              <p className="text-xs text-text-tertiary">Dubai Marina Townhouses</p>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <Calendar className="h-3 w-3 text-purple-400" />
                                {bookingDate.toLocaleDateString("en-US", {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <Clock className="h-3 w-3 text-purple-400" />
                                {bookingDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <MapPin className="h-3 w-3 text-purple-400" />
                                Dubai Marina, UAE
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-purple-500/20 bg-surface-dark/50 p-3">
                        <p className="text-xs font-medium text-text-tertiary mb-2">Lead Details</p>
                        <div className="space-y-1 text-xs text-text-secondary">
                          <p>
                            <span className="text-text-tertiary">Email:</span> {leadData.email}
                          </p>
                          <p>
                            <span className="text-text-tertiary">Phone:</span> {leadData.phone}
                          </p>
                          <p>
                            <span className="text-text-tertiary">Budget:</span> {leadData.budget}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-text-secondary">Demo Progress</p>
              <Badge variant="outline" className="rounded-xl border-purple-500/30">
                Step {currentStep} / {conversationScript.length}
              </Badge>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-dark border border-purple-500/20 overflow-hidden">
              <motion.div
                className="h-full premium-gradient"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / conversationScript.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

