/**
 * Shared Postgres client TLS: required for Supabase pooler and Neon.
 */
export function postgresSslOption(url: string | undefined): "require" | undefined {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname;
    if (
      host.includes("supabase.co") ||
      host.includes("pooler.supabase.com") ||
      host.includes("neon.tech")
    ) {
      return "require";
    }
  } catch {
    /* ignore */
  }
  return undefined;
}
