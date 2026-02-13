import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UTApi } from "uploadthing/server"

const f = createUploadthing()

export const ourFileRouter = {
  eventFlyer: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .onUploadComplete(async ({ file }) => {
      console.log("Uploaded event flyer:", file.ufsUrl)
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

// Server-side API for uploading from URLs
export const utapi = new UTApi()
