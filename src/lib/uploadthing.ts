import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UTApi } from "uploadthing/server"

const f = createUploadthing()

export const ourFileRouter = {
  eventFlyer: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .onUploadComplete(async ({ file }) => {
      // v7 uses 'url', older versions used 'ufsUrl'
      const fileUrl = file.url || file.ufsUrl
      console.log("Uploaded event flyer:", fileUrl)
      return { url: fileUrl }
    }),
  // Event gallery images
  eventGallery: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .onUploadComplete(async ({ file }) => {
      const fileUrl = file.url || file.ufsUrl
      console.log("Uploaded gallery image:", fileUrl)
      return { url: fileUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

// Server-side API for uploading from URLs
export const utapi = new UTApi()
