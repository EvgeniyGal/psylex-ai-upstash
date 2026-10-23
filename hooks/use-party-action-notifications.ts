"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/components/locale-provider";
import type { PartyNotification, PartyNotificationType } from "@/lib/mediator-session/types";
import type { PartyRole } from "@/lib/participant-roles";

type UsePartyActionNotificationsParams = {
  notification: PartyNotification | null | undefined;
  viewerRole: PartyRole | "mediator";
  enabled?: boolean;
  /**
   * When true, do not show (and clear) the "start window open" banner —
   * e.g. viewer already clicked Start, or lobby is in waiting/countdown.
   */
  startWindowConsumed?: boolean;
};

function messageForType(
  type: PartyNotification["type"],
  t: ReturnType<typeof useLocale>["portal"],
) {
  switch (type) {
    case "session_scheduled":
      return t.modeBNotifyScheduled;
    case "start_window_open":
      return t.modeBNotifyStartWindow;
    case "peer_ready":
      return null;
    case "session_started":
      return t.modeBNotifySessionStarted;
    case "question_received":
      return t.modeBNotifyQuestion;
    case "options_ready":
      return t.modeBNotifyOptions;
    case "compromise_pending":
      return t.modeBWaitingCompromisePublish;
    case "compromise_ready":
      return t.modeBNotifyCompromise;
    case "agreement_ready":
      return t.modeBNotifyAgreement;
    case "session_completed":
      return t.modeBNotifyCompleted;
    default:
      return null;
  }
}

export function usePartyActionNotifications({
  notification,
  viewerRole,
  enabled = true,
  startWindowConsumed = false,
}: UsePartyActionNotificationsParams) {
  const { portal: t } = useLocale();
  const seenRef = useRef<string | null>(null);
  const [bannerType, setBannerType] = useState<PartyNotificationType | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (startWindowConsumed && bannerType === "start_window_open") {
      setBanner(null);
      setBannerType(null);
    }
  }, [bannerType, startWindowConsumed]);

  useEffect(() => {
    if (!enabled || !notification) return;
    if (seenRef.current === notification.id) return;

    const target = notification.targetRole ?? "all";
    if (target !== "all" && target !== viewerRole) return;

    if (notification.type === "start_window_open" && startWindowConsumed) {
      seenRef.current = notification.id;
      return;
    }

    seenRef.current = notification.id;
    const message = messageForType(notification.type, t);
    if (!message) return;

    toast.message(message, { id: `party-notify-${notification.type}`, duration: 3500 });
    setBannerType(notification.type);
    setBanner(message);
  }, [enabled, notification, startWindowConsumed, t, viewerRole]);

  return {
    banner,
    clearBanner: () => {
      setBanner(null);
      setBannerType(null);
    },
  };
}
