import { after } from "next/server";

/**
 * Schedule Mode A LLM / continuation work after the HTTP response is sent.
 * Prefer this over bare `void` — Vercel may kill fire-and-forget when the request ends.
 */
export function scheduleMediationWork(label: string, run: () => Promise<void>) {
  const execute = () => {
    void run().catch((error) => {
      console.error(`[mediation] ${label}`, error);
    });
  };

  try {
    after(execute);
  } catch {
    execute();
  }
}
