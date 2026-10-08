/**
 * Where to go after signing in. Only a path on this site is accepted, so a
 * crafted `?redirect_url=https://evil.example` cannot bounce someone away.
 */
export function safeReturnPath(value: string | null | undefined, fallback = "/b"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback
  // The sign-in pages themselves would loop.
  if (/^\/(sign-in|sign-up)(\/|\?|$)/.test(value)) return fallback
  return value
}
