import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../config/redis";

const sendCommand = async (...args: string[]) => {
  const [command, ...rest] = args;
  if (!command) {
    throw new Error("Redis command is required");
  }
  return redis.call(command, ...rest) as Promise<import("rate-limit-redis").RedisReply>;
};

function makeLimiter(prefix: string, windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
    store: new RedisStore({ prefix, sendCommand }),
  });
}

export const globalRateLimiter = makeLimiter("rl:global:", 60 * 1000, 200);

/** Tighter limit for authentication-sensitive endpoints. */
export const authRateLimiter = makeLimiter("rl:auth:", 60 * 1000, 15);

/** Protects the (token-metered, rate-limited) Groq AI endpoints from bursts. */
export const aiRateLimiter = makeLimiter("rl:ai:", 60 * 1000, 20);
