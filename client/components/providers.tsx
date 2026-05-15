"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/queryClient";
import { ThemeInitializer } from "@/components/ThemeInitializer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <ThemeInitializer />
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
