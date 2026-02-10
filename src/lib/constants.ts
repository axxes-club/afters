// Site domain configuration
// Primary domain - change this when migrating to new domain
export const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || "afters.am"

// Legacy domains for backward compatibility
export const LEGACY_DOMAINS = ["afters.xxx", "afters.netlify.app"]

// Full URLs
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || `https://${SITE_DOMAIN}`

// Clerk proxy (uses www subdomain)
export const CLERK_PROXY_URL = process.env.NEXT_PUBLIC_CLERK_PROXY_URL || `https://www.${SITE_DOMAIN}/clerkproxy`

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
