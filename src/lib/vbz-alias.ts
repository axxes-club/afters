/**
 * vbz.afters.am is an alias for the VIBEZ camera.
 *
 * The QR codes an organizer prints around a room should be short, memorable and
 * on the event's own brand — "vbz.afters.am" reads on a sticker above a door in
 * a way that "afters.am/e/some-long-event-slug/vibez" never will. So the
 * subdomain rewrites to the same page the long URL serves. It is an alias, not a
 * second implementation: one route, one set of rules, one database.
 *
 *   vbz.afters.am/<event-slug>  ->  /e/<event-slug>/vibez
 *   vbz.afters.am               ->  /vbz   (a short explainer)
 *
 * It is a rewrite and not a redirect: a redirect would bounce the person off
 * their camera mid-flow and replace the short URL they scanned with a long one,
 * which defeats the point of printing it on a wall.
 *
 * Lives here rather than inline in middleware.ts so the rules can be tested
 * directly. A test that copies these rules only proves the copy is consistent
 * with itself, which is worth nothing.
 */

/** Exact match, never a suffix match: a suffix rule would hijack every subdomain
 *  the company ever adds. */
const VIBEZ_HOSTS = new Set(["vbz.afters.am", "www.vbz.afters.am"]);

export function resolveVibezAlias(host: string, pathname: string): string | null {
  const h = host.split(":")[0].toLowerCase();
  if (!VIBEZ_HOSTS.has(h)) return null;

  // Already a real path: pass it through untouched, or /e/x/vibez would become
  // /e/e/x/vibez/vibez on every hop, and the upload and join endpoints — which
  // the client calls by absolute path — would stop being reachable at all.
  if (
    pathname.startsWith("/e/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/vbz")
  ) {
    return null;
  }

  const slug = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!slug) return "/vbz";
  return `/e/${slug}/vibez`;
}
