import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { magicTokens, users } from "@/drizzle/schema";
import { getSiteUrl } from "@/lib/seo";

const MAGIC_LINK_TTL_HOURS = 72;

export type MagicTokenStatus = "ok" | "missing" | "used" | "expired" | "invalid";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Prefer the Host the admin is currently using (e.g. http://192.168.x.x:3000 on LAN)
 * so magic links work on phones / other devices. Fall back to NEXTAUTH_URL / site URL.
 */
export async function resolveMagicLinkOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = (h.get("x-forwarded-host") ?? h.get("host"))?.trim();
    if (host) {
      const forwarded = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
      const proto =
        forwarded ||
        (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  } catch {
    // headers() unavailable outside a request
  }

  return (
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    getSiteUrl().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export async function buildMagicLinkUrl(token: string) {
  const base = await resolveMagicLinkOrigin();
  return `${base}/auth/magic?token=${encodeURIComponent(token)}`;
}

export async function createMagicLinkForUser(userId: string) {
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_HOURS * 60 * 60 * 1000);

  await db.insert(magicTokens).values({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });

  return buildMagicLinkUrl(rawToken);
}

/** Check token without consuming — for confirm page / clearer errors. */
export async function inspectMagicToken(rawToken: string): Promise<MagicTokenStatus> {
  if (!rawToken.trim()) return "missing";

  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const [record] = await db
    .select()
    .from(magicTokens)
    .where(eq(magicTokens.tokenHash, tokenHash))
    .limit(1);

  if (!record) return "invalid";
  if (record.usedAt) return "used";
  if (record.expiresAt.getTime() <= now.getTime()) return "expired";
  return "ok";
}

export async function consumeMagicToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const [record] = await db
    .select()
    .from(magicTokens)
    .where(
      and(
        eq(magicTokens.tokenHash, tokenHash),
        isNull(magicTokens.usedAt),
        gt(magicTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!record) return null;

  const [user] = await db.select().from(users).where(eq(users.id, record.userId)).limit(1);
  if (!user) return null;

  // Mark used only if still unused (guards against double-submit races).
  const updated = await db
    .update(magicTokens)
    .set({ usedAt: now })
    .where(and(eq(magicTokens.id, record.id), isNull(magicTokens.usedAt)))
    .returning({ id: magicTokens.id });

  if (updated.length === 0) return null;

  return user;
}
