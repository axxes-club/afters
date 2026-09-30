import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveAccess } from "@/lib/vibez-identity"

/**
 * POST /api/events/[eventId]/vibez/react
 * The 🔥.
 *
 * A reaction is stored as an identity in `VibezPost.reactionSubjects` with the
 * count kept beside it, so drawing the number never costs a query and one person
 * cannot tap it four hundred times. The membership test is the whole guard.
 *
 * Toggling rather than incrementing is deliberate: a guest who taps twice meant
 * "unlike", and a button that only ever goes up is how a feed ends up with 400
 * 🔥 and no meaning.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const { viewer, access, settings } = await resolveAccess(eventId)

    if (!settings.allowReactions) {
      return NextResponse.json({ message: "Reactions are off for this event" }, { status: 403 })
    }
    // A reaction is authorship-adjacent: it is keyed on a subject, so it needs
    // one. This is the same rule canPost uses, minus the upload budget.
    if (!viewer.subject || (access !== "attendee" && access !== "staff")) {
      return NextResponse.json({ message: "Only attendees can react" }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const postId = typeof body.postId === "string" ? body.postId : null
    if (!postId) {
      return NextResponse.json({ message: "postId is required" }, { status: 400 })
    }

    const post = await prisma.vibezPost.findUnique({
      where: { id: postId },
      select: { id: true, eventId: true, removedAt: true, reactionSubjects: true },
    })
    if (!post || post.eventId !== eventId) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 })
    }
    if (post.removedAt) {
      return NextResponse.json({ message: "That post was removed" }, { status: 400 })
    }

    const already = post.reactionSubjects.includes(viewer.subject)
    const next = already
      ? post.reactionSubjects.filter((s) => s !== viewer.subject)
      : [...post.reactionSubjects, viewer.subject]

    // Bounded so the array cannot grow without limit on a popular photo, which
    // would make every read of this row larger for no benefit. Beyond the cap the
    // count still moves; only *who* is remembered stops being recorded.
    const capped = next.slice(-500)

    const updated = await prisma.vibezPost.update({
      where: { id: post.id },
      data: { reactionSubjects: capped, reactions: capped.length },
      select: { reactions: true },
    })

    return NextResponse.json({ reactions: updated.reactions, reacted: !already })
  } catch (error) {
    console.error("VIBEZ react error:", error)
    return NextResponse.json({ message: "Failed to react" }, { status: 500 })
  }
}
