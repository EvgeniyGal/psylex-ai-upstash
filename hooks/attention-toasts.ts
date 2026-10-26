"use client";

import { createElement } from "react";
import { toast } from "sonner";
import { ModeAToastSpinner } from "@/components/ui/mode-a-toast-spinner";
import {
  removeMediatorAttention,
  upsertMediatorAttention,
} from "@/lib/mediator-attention-dock";

/** Shared attention toaster (Mode A + Mode B parties) — top-left amber/green stack. */
export const ATTENTION_TOASTER = "mode-a";
export const SESSION_TIMER_TOASTER = "session-timer";

export type AttentionSurface = "toast" | "mediator-dock";

/** Orange — AI working / waiting on other party / saving. */
export const attentionWaitToastClassName =
  "mode-a-toast-attention !bg-amber-100/75 !text-amber-950 !border-2 !border-amber-400/80 shadow-md backdrop-blur-sm [&_[data-icon]]:!text-amber-700 max-w-[220px]";

/** Green — user must act (new question, vote, start, accept). */
export const attentionReadyToastClassName =
  "mode-a-toast-attention mode-a-toast-attention-ready !bg-emerald-100/75 !text-emerald-950 !border-2 !border-emerald-500/80 shadow-md backdrop-blur-sm [&_[data-icon]]:!text-emerald-700 max-w-[220px]";

function waitIcon() {
  return createElement(ModeAToastSpinner);
}

export function showAttentionWait(
  id: string,
  message: string,
  surface: AttentionSurface = "toast",
) {
  if (surface === "mediator-dock") {
    upsertMediatorAttention({ id, kind: "wait", message });
    return;
  }
  toast.loading(message, {
    id,
    toasterId: ATTENTION_TOASTER,
    duration: Infinity,
    className: attentionWaitToastClassName,
    icon: waitIcon(),
  });
}

export function dismissAttentionToast(id: string, surface: AttentionSurface = "toast") {
  if (surface === "mediator-dock") {
    removeMediatorAttention(id);
    return;
  }
  toast.dismiss(id);
}

const EPHEMERAL_READY_MS = 7000;

export function showAttentionReady(
  id: string,
  message: string,
  persistent = false,
  surface: AttentionSurface = "toast",
) {
  if (surface === "mediator-dock") {
    upsertMediatorAttention(
      { id, kind: "ready", message },
      persistent ? undefined : { autoDismissMs: EPHEMERAL_READY_MS },
    );
    return;
  }
  toast.success(message, {
    id,
    toasterId: ATTENTION_TOASTER,
    duration: persistent ? Infinity : EPHEMERAL_READY_MS,
    className: attentionReadyToastClassName,
  });
}

export function syncAttentionWait(
  enabled: boolean,
  active: boolean,
  id: string,
  message: string,
  surface: AttentionSurface = "toast",
) {
  if (!enabled) {
    dismissAttentionToast(id, surface);
    return;
  }
  if (active) showAttentionWait(id, message, surface);
  else dismissAttentionToast(id, surface);
}

export function syncAttentionReadyPersistent(
  enabled: boolean,
  active: boolean,
  id: string,
  message: string,
  surface: AttentionSurface = "toast",
) {
  if (!enabled) {
    dismissAttentionToast(id, surface);
    return;
  }
  if (active) showAttentionReady(id, message, true, surface);
  else dismissAttentionToast(id, surface);
}

/** @deprecated Prefer attention* names; kept for Mode A imports. */
export const modeAWaitToastClassName = attentionWaitToastClassName;
/** @deprecated Prefer attention* names; kept for Mode A imports. */
export const modeAReadyToastClassName = attentionReadyToastClassName;
