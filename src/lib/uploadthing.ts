import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UTApi } from "uploadthing/server"

const f = createUploadthing()

export const ourFileRouter = {
  eventFlyer: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .onUploadComplete(async ({ file }) => {
      console.log("Uploaded event flyer:", file.ufsUrl)
      return { url: file.ufsUrl }
    }),
  
  // Radio track audio files (MP3, up to 50MB)
  radioTrack: f({ audio: { maxFileSize: "64MB", maxFileCount: 1 } })
    .onUploadComplete(async ({ file }) => {
      console.log("Uploaded radio track:", file.ufsUrl)
      return { url: file.ufsUrl }
    }),
  
  // Radio track artwork
  radioArtwork: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .onUploadComplete(async ({ file }) => {
      console.log("Uploaded radio artwork:", file.ufsUrl)
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

// Server-side API for uploading from URLs
export const utapi = new UTApi()
