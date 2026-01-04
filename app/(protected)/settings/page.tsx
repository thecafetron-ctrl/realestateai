"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SettingsForm = {
  name: string;
  openaiApiKey: string;
};

const fetchSettings = async () => {
  const response = await fetch("/api/settings");
  if (!response.ok) {
    throw new Error("Unable to load settings");
  }
  return (await response.json()) as { profile: { name: string | null; email: string; openai_api_key: string | null } };
};

export default function SettingsPage() {
  const { register, handleSubmit, reset, formState } = useForm<SettingsForm>();

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (settingsQuery.data?.profile) {
      reset({
        name: settingsQuery.data.profile.name ?? "",
        openaiApiKey: settingsQuery.data.profile.openai_api_key ?? "",
      });
    }
  }, [settingsQuery.data, reset]);

  const updateMutation = useMutation({
    mutationFn: async (values: SettingsForm) => {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: values.name, openaiApiKey: values.openaiApiKey }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to save settings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Settings updated", { description: "Your AI credentials are now active." });
      settingsQuery.refetch();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Unable to update settings", { description: message });
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-text-primary bg-clip-text text-transparent premium-gradient">Settings</h1>
          <p className="text-sm text-text-tertiary mt-2">Manage your profile, API keys, and integration preferences.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Profile</CardTitle>
          <CardDescription className="text-text-tertiary">Share your name to personalize AI messaging and concierge workflows.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={handleSubmit((values) => {
              updateMutation.mutate(values);
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Jordan Parker" {...register("name")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="openaiApiKey">OpenAI API key</Label>
              <Input
                id="openaiApiKey"
                type="password"
                placeholder="sk-..."
                {...register("openaiApiKey")}
              />
              <p className="text-xs text-text-tertiary">
                Store your GPT-4 Turbo API key to switch the platform from demo mode to live AI generation.
              </p>
            </div>

            <Button type="submit" variant="gradient" disabled={updateMutation.isPending || !formState.isDirty} className="rounded-2xl px-5 shadow-purple-glow-sm">
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none premium-gradient text-white shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Integration checklist</CardTitle>
          <CardDescription className="text-purple-100">Ensure environment variables are configured for Supabase and OpenAI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-purple-50">
          <p>• NEXT_PUBLIC_SUPABASE_URL</p>
          <p>• NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
          <p>• SUPABASE_URL (server)</p>
          <p>• SUPABASE_ANON_KEY (server)</p>
          <p>• OPENAI_API_KEY</p>
        </CardContent>
      </Card>
    </div>
  );
}


