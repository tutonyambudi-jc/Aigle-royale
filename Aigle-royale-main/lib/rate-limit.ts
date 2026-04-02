/**
 * Limitation de débit en mémoire (par processus). Suffisante pour freiner les abus basiques ;
 * derrière un load-balancer, prévoir une solution distribuée (Redis) si le trafic l'exige.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

function pruneExpired(now: number) {
  for (const [k, v] of buckets) {
    if (now > v.resetAt) buckets.delete(k)
  }
}

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  if (buckets.size > 10_000) pruneExpired(now)

  const existing = buckets.get(key)
  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }
  if (existing.count < max) {
    existing.count += 1
    return { ok: true }
  }
  const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
  return { ok: false, retryAfterSec }
}

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real
  return 'unknown'
}
