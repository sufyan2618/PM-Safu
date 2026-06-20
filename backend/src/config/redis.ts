import { Redis } from "ioredis";
import { env } from "./env";

/**
 * Shared ioredis connection used by BullMQ queues, workers and the rate limiter.
 * `maxRetriesPerRequest: null` is required by BullMQ.
 */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const bullConnection = { connection: redis };
