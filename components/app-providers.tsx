"use client";

import { SessionProvider } from "next-auth/react";
import { HelpProvider } from "@/components/help/help-provider";
import { LocaleProvider } from "@/components/locale-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider>
        <HelpProvider>{children}</HelpProvider>
      </LocaleProvider>
    </SessionProvider>
  );
}
