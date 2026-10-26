"use client";

export type MediatorAttentionKind = "wait" | "ready" | "timer";

export type MediatorAttentionItem = {
  id: string;
  kind: MediatorAttentionKind;
  message: string;
  /** Optional secondary line (e.g. countdown time). */
  detail?: string;
  ended?: boolean;
};

type Snapshot = MediatorAttentionItem[];

const items = new Map<string, MediatorAttentionItem>();
const listeners = new Set<() => void>();
let snapshot: Snapshot = [];

function emit() {
  snapshot = Array.from(items.values()).sort((a, b) => {
    const rank = (k: MediatorAttentionKind) =>
      k === "timer" ? 0 : k === "wait" ? 1 : 2;
    return rank(a.kind) - rank(b.kind) || a.id.localeCompare(b.id);
  });
  for (const listener of listeners) listener();
}

export function upsertMediatorAttention(item: MediatorAttentionItem) {
  items.set(item.id, item);
  emit();
}

export function removeMediatorAttention(id: string) {
  if (!items.delete(id)) return;
  emit();
}

export function clearMediatorAttention() {
  if (items.size === 0) return;
  items.clear();
  emit();
}

export function getMediatorAttentionSnapshot(): Snapshot {
  return snapshot;
}

export function subscribeMediatorAttention(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
