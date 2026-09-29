import { redirect, notFound } from "next/navigation";

/**
 * afters.am/vbz/<event-slug> — the short URL printed on QR codes around a room.
 *
 * It redirects to the canonical `/e/<slug>/vibez` rather than rendering the feed
 * itself. One reason is that the feed is a Server Component that looks the event
 * up and handles "not enabled" and "not started yet"; duplicating that here would
 * be a second copy to keep in step. The other is that the canonical URL is what
 * people should end up at, so a shared link and a browser history entry both
 * show something meaningful.
 *
 * `permanentRedirect` is deliberately not used: the slug can change, an event can
 * be unpublished, and a 308 would be cached by the browser past the point where
 * it still resolves.
 */
export default async function VibezShortLink({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cleaned = decodeURIComponent(slug).trim();
  if (!cleaned) notFound();

  redirect(`/e/${encodeURIComponent(cleaned)}/vibez`);
}
