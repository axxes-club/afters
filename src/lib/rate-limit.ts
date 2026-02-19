// In-memory rate limiting for RSVP endpoint (per IP)
export const rsvpRateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRsvpRateLimit(ip: string, maxAttempts = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const record = rsvpRateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    rsvpRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= maxAttempts) {
    return false
  }

  record.count++
  return true
}
