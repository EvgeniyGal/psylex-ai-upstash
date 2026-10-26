import { cn } from "@/lib/utils";

/** Clean CSS ring for Mode A wait toasts (avoids uneven Material glyph spin). */
export function ModeAToastSpinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-amber-700/25 border-t-amber-700",
        className,
      )}
    />
  );
}
