import "server-only";

/**
 * Sliding-window limiter, in memory (per server instance). Good enough for a prototype and for a single
 * node; put it behind Redis/Upstash or the platform firewall when running multiple instances.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t > windowMs)) hits.delete(k);
  return true;
}

export const resetRateLimits = () => hits.clear();
