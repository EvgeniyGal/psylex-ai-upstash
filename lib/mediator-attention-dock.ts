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
const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();
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

function clearDismissTimer(id: string) {
  const timer = dismissTimers.get(id);
  if (!timer) return;
  clearTimeout(timer);
  dismissTimers.delete(id);
}

export function upsertMediatorAttention(
  item: MediatorAttentionItem,
  options?: { autoDismissMs?: number },
) {
  clearDismissTimer(item.id);
  items.set(item.id, item);
  emit();

  const autoDismissMs = options?.autoDismissMs;
  if (autoDismissMs != null && autoDismissMs > 0) {
    dismissTimers.set(
      item.id,
      setTimeout(() => {
        dismissTimers.delete(item.id);
        removeMediatorAttention(item.id);
      }, autoDismissMs),
    );
  }
}

export function removeMediatorAttention(id: string) {
  clearDismissTimer(id);
  if (!items.delete(id)) return;
  emit();
}

export function clearMediatorAttention() {
  for (const id of dismissTimers.keys()) clearDismissTimer(id);
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
