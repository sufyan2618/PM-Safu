import { createHash } from "node:crypto";
import { redis } from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../logger";

const PREFIX = "ai:";

/** Stable sha256 hash of arbitrary JSON-serialisable input, used to build cache keys. */
export function hashInput(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 32);
}

/** Build a namespaced cache key, e.g. cacheKey("invoice-draft", companyId, hash). */
export function cacheKey(...parts: string[]): string {
  return PREFIX + parts.join(":");
}

/**
 * Cache-aside wrapper: returns the cached value when present, otherwise runs `fn`,
 * stores the result with a TTL, and returns it. Cache errors never break the request.
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = env.AI_CACHE_TTL_SECONDS,
): Promise<{ value: T; cached: boolean }> {
  try {
    const hit = await redis.get(key);
    if (hit) {
      return { value: JSON.parse(hit) as T, cached: true };
    }
  } catch (error) {
    logger.warn("AI cache read failed", { key, error: (error as Error).message });
  }

  const value = await fn();

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    logger.warn("AI cache write failed", { key, error: (error as Error).message });
  }

  return { value, cached: false };
}
