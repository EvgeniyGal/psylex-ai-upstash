import { handle } from "@upstash/realtime";
import { realtime } from "@/lib/realtime";
import { authorizeRealtimeChannels } from "@/lib/realtime/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = handle({
  realtime,
  middleware: async ({ channels }) => authorizeRealtimeChannels(channels),
});
