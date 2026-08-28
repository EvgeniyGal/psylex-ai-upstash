import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Locale-stable string compare for SSR/client-consistent table sorting. */
const stableCollator = new Intl.Collator("en", { sensitivity: "base" });

export function compareStringsStable(left: string, right: string) {
  return stableCollator.compare(left, right);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_RE.test(value);
}
