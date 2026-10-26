"use client";

import { useSyncExternalStore } from "react";
import { ModeAToastSpinner } from "@/components/ui/mode-a-toast-spinner";
import {
  getMediatorAttentionSnapshot,
  subscribeMediatorAttention,
  type MediatorAttentionItem,
} from "@/lib/mediator-attention-dock";
import { cn } from "@/lib/utils";

function DockCard({ item }: { item: MediatorAttentionItem }) {
  const isTimer = item.kind === "timer";
  const isReady = item.kind === "ready";

  return (
    <div
      className={cn(
        "mode-a-toast-attention w-full rounded-lg border-2 px-3 py-2.5 shadow-md",
        isTimer &&
          "mode-a-toast-attention-timer border-law-line bg-law-fill text-on-surface",
        isReady &&
          "mode-a-toast-attention-ready border-emerald-500 bg-emerald-100 text-emerald-950",
        !isTimer &&
          !isReady &&
          "border-amber-400 bg-amber-100 text-amber-950",
      )}
    >
      <div className="flex items-start gap-2">
        {item.kind === "wait" ? (
          <span className="mt-0.5 shrink-0 text-amber-700">
            <ModeAToastSpinner />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          {isTimer ? (
            <>
              <p className="font-display text-[10px] uppercase tracking-wide text-on-surface-variant">
                {item.message}
              </p>
              <p
                className={cn(
                  "font-display text-xl font-semibold tabular-nums leading-tight",
                  item.ended ? "text-error" : "text-law",
                )}
              >
                {item.detail ?? "—"}
              </p>
            </>
          ) : (
            <p className="text-[12px] font-medium leading-snug">{item.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function MediatorAttentionDock() {
  const items = useSyncExternalStore(
    subscribeMediatorAttention,
    getMediatorAttentionSnapshot,
    getMediatorAttentionSnapshot,
  );

  if (items.length === 0) return null;

  return (
    <div className="mediator-attention-dock flex max-h-[40vh] w-full flex-col gap-2 overflow-x-clip overflow-y-auto p-0.5">
      {items.map((item) => (
        <DockCard item={item} key={item.id} />
      ))}
    </div>
  );
}
