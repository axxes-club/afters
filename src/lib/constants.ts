// Site domain configuration
// Primary domain - uses env var, falls back to afters.xxx until fully migrated
export const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || "afters.xxx"

// Target domain for redirects (when enabled)
export const PRIMARY_DOMAIN = "afters.am"

// Legacy domains that should redirect to PRIMARY_DOMAIN
export const LEGACY_DOMAINS = ["afters.netlify.app"]

// Whether to enable redirects from legacy domains (disable until Clerk is configured)
export const ENABLE_DOMAIN_REDIRECT = process.env.NEXT_PUBLIC_ENABLE_DOMAIN_REDIRECT === "true"

// Full URLs
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || `https://${SITE_DOMAIN}`

// Clerk proxy (must match exactly what's configured in Clerk Dashboard - no www)
export const CLERK_PROXY_URL = process.env.NEXT_PUBLIC_CLERK_PROXY_URL || `https://${SITE_DOMAIN}/clerkproxy`

// URL prefixes for profile pages
export const URL_PREFIXES = {
  organizer: `${SITE_DOMAIN}/o/`,
  artist: `${SITE_DOMAIN}/a/`,
  personal: `${SITE_DOMAIN}/p/`,
  base: `${SITE_DOMAIN}/`,
} as const

// Check if current hostname is a legacy domain
export function isLegacyDomain(hostname: string): boolean {
  return LEGACY_DOMAINS.some(d => hostname.includes(d))
}
