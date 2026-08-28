"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { HelpChatWidget } from "@/components/help/help-chat-widget";
import { HelpModal } from "@/components/help/help-modal";

type HelpContextValue = {
  openHelp: () => void;
};

const HelpContext = createContext<HelpContextValue>({ openHelp: () => {} });

export function HelpProvider({ children }: { children: ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  const value = useMemo(() => ({ openHelp }), [openHelp]);

  return (
    <HelpContext.Provider value={value}>
      {children}
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <HelpChatWidget />
    </HelpContext.Provider>
  );
}

export function useHelp() {
  return useContext(HelpContext);
}
