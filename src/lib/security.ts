/**
 * Security helpers for sanitizing user input
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Validate and sanitize URL for safe href usage
 * Only allows http:// and https:// protocols
 * Returns undefined for invalid/unsafe URLs
 */
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol) ? url : undefined
  } catch {
    return undefined
  }
}

/**
 * Validate CSS color value (hex only)
 * Returns undefined for invalid colors
 */
export function safeColor(color: string | null | undefined): string | undefined {
  if (!color) return undefined
  // Only allow valid hex colors
  const hexPattern = /^#[0-9a-fA-F]{6}$/
  return hexPattern.test(color) ? color : undefined
}
