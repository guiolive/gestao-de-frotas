/**
 * In-memory sliding-window rate limiter.
 *
 * Simple, dependency-free, reset on server restart. Good enough for a single
 * Node instance. For multi-instance deployments, replace with @upstash/ratelimit
 * or similar distributed solution.
 */

type Entry = { timestamps: number[] };

const buckets = new Map<string, Entry>();

// Cleanup de chaves ociosas a cada 5 min
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function ensureCleanup(windowMs: number) {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets.entries()) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
      if (entry.timestamps.length === 0) buckets.delete(key);
    }
  }, CLEANUP_INTERVAL_MS);
  // Não segurar o processo aberto só por causa do timer
  if (typeof cleanupTimer.unref === "function") cleanupTimer.unref();
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
};

/**
 * Check if a key is within the rate limit.
 * @param key Unique identifier (IP, userId, email, etc)
 * @param max Maximum allowed hits in the window
 * @param windowMs Window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  ensureCleanup(windowMs);

  const now = Date.now();
  const entry = buckets.get(key) ?? { timestamps: [] };

  // Remove timestamps fora da janela
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= max) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, windowMs - (now - oldest)),
    };
  }

  entry.timestamps.push(now);
  buckets.set(key, entry);

  return {
    allowed: true,
    remaining: max - entry.timestamps.length,
    resetInMs: windowMs,
  };
}

/**
 * Extract a client identifier from the request. Uses X-Forwarded-For / X-Real-IP
 * when present (behind proxy like Vercel), falls back to a generic "unknown".
 */
export function clientKey(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
