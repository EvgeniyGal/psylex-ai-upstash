"use client";

import { SessionProvider } from "next-auth/react";
import { RealtimeProvider } from "@upstash/realtime/client";
import { HelpProvider } from "@/components/help/help-provider";
import { LocaleProvider } from "@/components/locale-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RealtimeProvider api={{ url: "/api/realtime", withCredentials: true }}>
        <LocaleProvider>
          <HelpProvider>{children}</HelpProvider>
        </LocaleProvider>
      </RealtimeProvider>
    </SessionProvider>
  );
}
