"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useUploadThing } from "@/lib/uploadthing-client"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import Image from "next/image"

interface FlyerUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}

export function FlyerUpload({ value, onChange, disabled }: FlyerUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { startUpload } = useUploadThing("eventFlyer", {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.ufsUrl) {
        const url = res[0].ufsUrl
        setPreview(url)
        onChange(url)
        setError(null)
      }
      setIsUploading(false)
    },
    onUploadError: (err) => {
      setError(err.message || "Upload failed")
      setIsUploading(false)
    },
  })

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return
      if (disabled) return

      const file = acceptedFiles[0]

      // Preview immediately
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      setError(null)
      setIsUploading(true)

      // Upload
      try {
        await startUpload([file])
      } catch (err) {
        setError("Upload failed. Please try again.")
        setIsUploading(false)
      }
    },
    [startUpload, disabled]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024, // 4MB
    disabled: disabled || isUploading,
  })

  const removeImage = () => {
    setPreview(null)
    onChange(null)
    setError(null)
  }

  // If we have an image, show the preview with remove button
  if (preview) {
    return (
      <div className="relative group">
        <div className="relative aspect-[3/4] w-full max-w-[300px] rounded-lg overflow-hidden border border-border bg-muted">
          <Image
            src={preview}
            alt="Event flyer preview"
            fill
            className="object-cover"
            unoptimized={preview.startsWith("blob:")}
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>
        {!disabled && !isUploading && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  // Upload zone
  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`
          relative flex flex-col items-center justify-center gap-2
          aspect-[3/4] w-full max-w-[300px] rounded-lg border-2 border-dashed
          transition-colors cursor-pointer
          ${isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <div className="p-4 rounded-full bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-medium">
                {isDragActive ? "Drop your flyer here" : "Drag & drop your flyer"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse (PNG, JPG, max 4MB)
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" className="mt-2">
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
