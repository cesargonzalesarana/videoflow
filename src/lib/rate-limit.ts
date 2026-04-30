const rateLimitMap = new Map<string, {count: number; lastReset: number}>()

export function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000) {
  const now = Date.now()
  let entry = rateLimitMap.get(ip)

  if (!entry || now - entry.lastReset > windowMs) {
    entry = { count: 0, lastReset: now }
    rateLimitMap.set(ip, entry)
  }

  entry.count++

  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap) {
      if (now - v.lastReset > windowMs) rateLimitMap.delete(k)
    }
  }

  return {
    success: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.lastReset + windowMs,
  }
}