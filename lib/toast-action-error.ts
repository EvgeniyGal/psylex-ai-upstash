import { toast } from "sonner";

/**
 * True for Next.js navigation control flow (redirect / notFound) that should
 * not be shown as user-facing toast errors.
 */
export function isNextNavigationError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const digest = "digest" in error ? String((error as { digest?: unknown }).digest ?? "") : "";
  if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")) {
    return true;
  }
  const message = error instanceof Error ? error.message : "";
  return /^NEXT_(REDIRECT|NOT_FOUND|HTTP_ERROR_FALLBACK)/.test(message);
}

/**
 * Show a localized error toast for failed client actions.
 * Rethrows Next redirect/notFound so navigation still works when actions call redirect().
 * Always uses `fallback` — never raw server English or redirect digests.
 */
export function toastActionError(error: unknown, fallback: string): void {
  if (isNextNavigationError(error)) {
    throw error;
  }
  toast.error(fallback);
}
