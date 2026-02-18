// App version
export const APP_VERSION = "0.2.2b"

// Site domain configuration
// Primary domain - afters.am is now the main domain
export const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || "afters.am"

// Legacy domains that should redirect to primary domain
export const LEGACY_DOMAINS = ["afters.netlify.app", "afters.xxx"]

// Full URLs
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || `https://${SITE_DOMAIN}`

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
