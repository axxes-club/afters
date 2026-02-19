// In-memory rate limiting for view tracking (per IP)
export const viewRateLimitMap = new Map<string, { count: number; resetAt: number }>()

// Periodically evict expired entries to prevent unbounded growth
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of viewRateLimitMap) {
    if (now > record.resetAt) viewRateLimitMap.delete(ip)
  }
}, 5 * 60 * 1000)

export function checkViewRateLimit(ip: string, maxAttempts = 5, windowMs = 60000): boolean {
  const now = Date.now()
  const record = viewRateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    viewRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= maxAttempts) {
    return false
  }

  record.count++
  return true
}
