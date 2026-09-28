import { createUploadthing, type FileRouter } from "uploadthing/next"
import { z } from "zod"
import { UploadThingError, UTApi } from "uploadthing/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { requireOrganizer } from "@/lib/auth-utils"
import { canPost, uploadBudget, vibezAccess } from "@/lib/vibez"
import { verifyTicket } from "@/lib/vibez-ticket"

const f = createUploadthing()

export async function organizerMiddleware() {
  try {
    const user = await requireOrganizer()
    return { userId: user.id }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Unauthorized")) {
      throw new UploadThingError("Unauthorized")
    }
    throw err
  }
}

export async function authMiddleware() {
  const { userId } = await auth()
  if (!userId) throw new UploadThingError("Unauthorized")
  return { userId }
}

export const ourFileRouter = {
  eventFlyer: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(organizerMiddleware)
    .onUploadComplete(async ({ file }) => {
      // v7 uses 'url', older versions used 'ufsUrl'
      const fileUrl = file.url || file.ufsUrl
      console.log("Uploaded event flyer:", fileUrl)
      return { url: fileUrl }
    }),
  // Event gallery images
  eventGallery: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .middleware(organizerMiddleware)
    .onUploadComplete(async ({ file }) => {
      const fileUrl = file.url || file.ufsUrl
      console.log("Uploaded gallery image:", fileUrl)
      return { url: fileUrl }
    }),
  // Feedback screenshots
  feedbackScreenshot: f({ image: { maxFileSize: "4MB", maxFileCount: 3 } })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ file }) => {
      const fileUrl = file.url || file.ufsUrl
      console.log("Uploaded feedback screenshot:", fileUrl)
      return { url: fileUrl }
    }),
  // Custom logo for sidebar
  customLogo: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(organizerMiddleware)
    .onUploadComplete(async ({ file }) => {
      const fileUrl = file.url || file.ufsUrl
      console.log("Uploaded custom logo:", fileUrl)
      return { url: fileUrl }
    }),
  // VIBEZ (BETA): attendee feed images.
  //
  // The client asks /api/events/[eventId]/vibez/upload-ticket first; that
  // endpoint decides whether this person may post here, right now. Without
  // that check any signed-in account could push 4MB files at our storage and
  // then be told no at the last step — the bytes would already be spent. The
  // ticket is short-lived, single-event, and useless to anyone else.
  vibezPost: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .input(z.object({ eventId: z.string().min(1), ticket: z.string().min(1) }))
    .middleware(async ({ req }) => {
      const { userId } = await auth()
      if (!userId) throw new UploadThingError("Unauthorized")

      // The declared input arrives in the multipart body alongside the file.
      const form = await req.formData().catch(() => null)
      const eventId = form?.get("eventId")
      const ticket = form?.get("ticket")
      if (typeof eventId !== "string" || typeof ticket !== "string") {
        throw new UploadThingError("Missing upload ticket")
      }
      if (!verifyTicket(ticket, userId, eventId)) {
        throw new UploadThingError("Upload ticket is invalid or expired")
      }

      const user = await currentUser()
      const email = user?.emailAddresses?.[0]?.emailAddress ?? null

      // Re-checked here, not just at ticket time: a ban may have landed in
      // between, and this middleware is the last gate before the bytes land.
      const access = await vibezAccess(eventId, userId, email)
      if (access === "banned") throw new UploadThingError("Banned from this feed")
      if (!canPost(access)) {
        throw new UploadThingError("Only attendees can post to the VIBEZ feed")
      }

      const budget = await uploadBudget(eventId, userId)
      if (!budget.allowed) throw new UploadThingError(budget.reason ?? "Too many uploads")

      return { userId, eventId }
    })
    .onUploadComplete(async ({ file }) => {
      const fileUrl = file.url || file.ufsUrl
      return { url: fileUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

// Server-side API for uploading from URLs
export const utapi = new UTApi()
