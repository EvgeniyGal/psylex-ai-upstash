import { isUuid } from "@/lib/utils";

export type FooterDemoMode = "landing" | "modeA" | "modeB";

export function demoModeFromRoomCreatedBy(createdByUserId: string | null | undefined): "modeA" | "modeB" {
  return createdByUserId ? "modeB" : "modeA";
}

export function isLandingFooterPath(pathname: string) {
  return pathname === "/" || pathname === "/login";
}

const MEDIATOR_ROOM_PATH = /^\/mediator\/rooms\/([^/]+)$/;

export function roomIdFromFooterPath(pathname: string) {
  const match = pathname.match(MEDIATOR_ROOM_PATH);
  const candidate = match?.[1] ?? null;
  if (!candidate || !isUuid(candidate)) return null;
  return candidate;
}
