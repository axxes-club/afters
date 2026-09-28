import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError, UTApi } from "uploadthing/server"
import { auth } from "@clerk/nextjs/server"
import { requireOrganizer } from "@/lib/auth-utils"

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
  // VIBEZ (BETA): attendee feed images - any logged-in user (attendee check in API)
  vibezPost: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ file }) => {
      const fileUrl = file.url || file.ufsUrl
      return { url: fileUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

// Server-side API for uploading from URLs
export const utapi = new UTApi()
