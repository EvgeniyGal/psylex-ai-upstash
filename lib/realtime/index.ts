import { Realtime, type InferRealtimeEvents } from "@upstash/realtime";
import { z } from "zod";
import { redis } from "@/lib/redis";

const changePayload = z.object({
  t: z.number(),
});

const schema = {
  room: {
    change: changePayload,
  },
  user: {
    change: changePayload,
  },
};

export const realtime = new Realtime({
  schema,
  redis,
  maxDurationSecs: 300,
  history: {
    maxLength: 8,
    expireAfterSecs: 120,
  },
});

export type RealtimeEvents = InferRealtimeEvents<typeof realtime>;
