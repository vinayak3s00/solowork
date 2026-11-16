import { HttpError } from './http'

// Simple in-memory fixed-window rate limiter. Suitable for single-instance
// deployments and abuse mitigation on public endpoints. For multi-instance
// production, swap this for a shared store (e.g. Redis / Upstash).
const globalForRL = globalThis
const buckets = globalForRL.__soloworkRateBuckets || new Map()
globalForRL.__soloworkRateBuckets = buckets

/**
 * Enforces a rate limit for a given key. Throws HttpError(429) when exceeded.
 * @param {string} key    Unique identifier (e.g. `capture:<ip>`)
 * @param {number} limit  Max requests allowed per window
 * @param {number} windowMs Window size in milliseconds
 */
export function enforceRateLimit(key, limit = 10, windowMs = 60_000) {
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    throw new HttpError(429, 'Too many requests. Please try again later.', { retryAfter })
  }

  entry.count += 1

  // Opportunistic cleanup to bound memory growth.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now >= v.resetAt) buckets.delete(k)
    }
  }
}

/** Best-effort client IP extraction from standard proxy headers. */
export function getClientIp(request) {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}
