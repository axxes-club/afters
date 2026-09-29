import { utapi } from "@/lib/uploadthing"

/**
 * Delete a VIBEZ photo from storage.
 *
 * UploadThing's deleteFiles takes a file key, not a public URL, so the key has
 * to be recovered from the URL we stored. VIBEZ URLs look like:
 *
 *   https://<id>.ufs.sh/f/<fileKey>
 *   https://utfs.io/f/<fileKey>
 *
 * Anything we can't parse a key out of is left alone: the post is already out
 * of the feed, and a wrong guess at a key could delete someone else's file.
 */
export function fileKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!/^(.+\.)?ufs\.sh$/i.test(parsed.hostname) && parsed.hostname !== "utfs.io") {
      return null
    }
    const key = parsed.pathname.replace(/^\/+/, "").replace(/^f\//, "")
    return key.length > 0 ? key : null
  } catch {
    return null
  }
}

/**
 * Delete a VIBEZ photo from storage, and say whether it actually went.
 *
 * Deliberately NOT called when a post is removed. It used to be, and the restore
 * endpoint then put the row back with its file already gone — a broken image in
 * the middle of the feed, which is worse than the thing the moderator was trying
 * to undo. Removal hides the row; this runs later, from the purge job, once the
 * removal is old enough to be treated as final.
 *
 * Returns false for a URL whose key cannot be parsed. A wrong guess at a file key
 * would delete somebody else's photo, so an unrecognised URL is left alone.
 */
export async function purgeStoredFile(url: string): Promise<boolean> {
  const key = fileKeyFromUrl(url)
  if (!key) return false
  await utapi.deleteFiles(key)
  return true
}
