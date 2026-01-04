"use client";

import { PropsWithChildren, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SampleModeProvider } from "@/components/sample-mode-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { SonnerToaster } from "@/components/ui/sonner-provider";

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SampleModeProvider>
          {children}
          <SonnerToaster />
        </SampleModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}


