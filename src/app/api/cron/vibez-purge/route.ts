import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { purgeStoredFile } from "@/lib/vibez-storage"

/**
 * GET /api/cron/vibez-purge
 * Delete the images behind posts that were removed long enough ago.
 *
 * Why a delay: removing a post now only hides it, so a moderator who removes
 * the wrong photo can put it back. Deleting the file at the moment of removal —
 * which is what this used to do from the DELETE route — made "restore" restore
 * a row pointing at nothing, so a moderation mistake became a broken image in
 * the middle of the feed. That is worse than the mistake it was undoing.
 *
 * So: remove now, purge after GRACE_HOURS, and record `filePurgedAt` so the
 * restore endpoint can refuse honestly instead of resurrecting a dead URL.
 *
 * Schedule this hourly. Uses the same CRON_SECRET convention as
 * /api/cron/event-reminders.
 */

const GRACE_HOURS = 24
const BATCH = 200

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  // Fail closed. The original guard was `if (cronSecret && ...)`, so an unset
  // CRON_SECRET left the endpoint fully open to anyone on the internet, and this
  // route deletes files. An unauthenticated purge is worse than no purge at all.
  if (!cronSecret) {
    console.error("VIBEZ purge: CRON_SECRET is not set; refusing to run.")
    return NextResponse.json({ error: "Not configured" }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - GRACE_HOURS * 60 * 60 * 1000)

  const stale = await prisma.vibezPost.findMany({
    where: {
      removedAt: { not: null, lte: cutoff },
      filePurgedAt: null,
    },
    select: { id: true, imageUrl: true },
    orderBy: { removedAt: "asc" },
    take: BATCH,
  })

  let purged = 0
  let skipped = 0

  for (const post of stale) {
    // Shared image URLs may be reused by the same subject. Retain bytes while
    // any other post remains live or inside its restore retention window.
    const referenced = await prisma.vibezPost.findFirst({
      where: { id: { not: post.id }, imageUrl: post.imageUrl, filePurgedAt: null,
        OR: [{ removedAt: null }, { removedAt: { gt: cutoff } }] },
      select: { id: true },
    })
    if (referenced) { skipped++; continue }
    let deleted = false
    try {
      deleted = await purgeStoredFile(post.imageUrl)
      if (deleted) purged++
      else skipped++
    } catch (error) {
      console.error("VIBEZ storage purge failed; retained for retry")
      skipped++
    }

    // Failed, unmigrated or retained shared objects stay retryable. A database
    // flag must never claim that bytes were purged when storage retained them.
    if (!deleted) continue
    await prisma.vibezPost.update({
      where: { id: post.id },
      data: { filePurgedAt: new Date() },
    })
  }

  return NextResponse.json({
    considered: stale.length,
    purged,
    // Files we could not identify a key for. Left in place, and safe to ignore.
    skipped,
    moreRemaining: stale.length === BATCH,
  })
}
