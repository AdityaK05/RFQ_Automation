"use client";

import { SessionProvider } from "next-auth/react";
import { ComposeProvider } from "@/components/shared/ComposeContext";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        <ComposeProvider>{children}</ComposeProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
