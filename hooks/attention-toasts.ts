"use client";

import { createElement } from "react";
import { toast } from "sonner";
import { ModeAToastSpinner } from "@/components/ui/mode-a-toast-spinner";

/** Shared attention toaster (Mode A + Mode B) — top-left amber/green stack. */
export const ATTENTION_TOASTER = "mode-a";
export const SESSION_TIMER_TOASTER = "session-timer";

/** Orange — AI working / waiting on other party / saving. */
export const attentionWaitToastClassName =
  "mode-a-toast-attention !bg-amber-100 !text-amber-950 !border-2 !border-amber-400 shadow-md [&_[data-icon]]:!text-amber-700";

/** Green — user must act (new question, vote, start, accept). */
export const attentionReadyToastClassName =
  "mode-a-toast-attention mode-a-toast-attention-ready !bg-emerald-100 !text-emerald-950 !border-2 !border-emerald-500 shadow-md [&_[data-icon]]:!text-emerald-700";

function waitIcon() {
  return createElement(ModeAToastSpinner);
}

export function showAttentionWait(id: string, message: string) {
  toast.loading(message, {
    id,
    toasterId: ATTENTION_TOASTER,
    duration: Infinity,
    className: attentionWaitToastClassName,
    icon: waitIcon(),
  });
}

export function dismissAttentionToast(id: string) {
  toast.dismiss(id);
}

export function showAttentionReady(id: string, message: string, persistent = false) {
  toast.success(message, {
    id,
    toasterId: ATTENTION_TOASTER,
    duration: persistent ? Infinity : 7000,
    className: attentionReadyToastClassName,
  });
}

export function syncAttentionWait(
  enabled: boolean,
  active: boolean,
  id: string,
  message: string,
) {
  if (!enabled) {
    dismissAttentionToast(id);
    return;
  }
  if (active) showAttentionWait(id, message);
  else dismissAttentionToast(id);
}

export function syncAttentionReadyPersistent(
  enabled: boolean,
  active: boolean,
  id: string,
  message: string,
) {
  if (!enabled) {
    dismissAttentionToast(id);
    return;
  }
  if (active) showAttentionReady(id, message, true);
  else dismissAttentionToast(id);
}

/** @deprecated Prefer attention* names; kept for Mode A imports. */
export const modeAWaitToastClassName = attentionWaitToastClassName;
/** @deprecated Prefer attention* names; kept for Mode A imports. */
export const modeAReadyToastClassName = attentionReadyToastClassName;
