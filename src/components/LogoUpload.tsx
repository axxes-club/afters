"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useUploadThing } from "@/lib/uploadthing-client"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"

interface LogoUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}

export function LogoUpload({ value, onChange, disabled }: LogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { startUpload } = useUploadThing("customLogo", {
    onClientUploadComplete: (res) => {
      const fileUrl = res?.[0]?.url || res?.[0]?.ufsUrl
      if (fileUrl) {
        setPreview(fileUrl)
        onChange(fileUrl)
        setError(null)
      } else {
        setError("Upload completed but no URL returned")
      }
      setIsUploading(false)
    },
    onUploadError: (err) => {
      console.error("Upload error:", err)
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

      try {
        const result = await startUpload([file])
        if (!result || result.length === 0) {
          setError("Upload failed - no response")
          setIsUploading(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed")
        setIsUploading(false)
      }
    },
    [startUpload, disabled]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".svg", ".webp"],
    },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024, // 2MB
    disabled: disabled || isUploading,
  })

  const removeImage = () => {
    setPreview(null)
    onChange(null)
    setError(null)
  }

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative group inline-block">
          <div className="relative h-16 px-6 border border-white/10 bg-black/50 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Logo preview"
              className="max-h-10 max-w-[180px] object-contain"
              onError={() => setError("Failed to load image")}
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
          </div>
          {!disabled && !isUploading && (
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            relative flex items-center gap-4 p-4 border-2 border-dashed cursor-pointer transition-colors
            ${isDragActive ? "border-primary bg-primary/10" : "border-white/20 hover:border-white/40"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-white/40" />
              <span className="text-sm text-white/40">Uploading...</span>
            </>
          ) : (
            <>
              <div className="w-12 h-12 border border-white/10 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-white/30" />
              </div>
              <div>
                <p className="text-sm font-mono text-white/60">
                  {isDragActive ? "Drop logo here" : "Drop logo or click to upload"}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  PNG, JPG, SVG • Max 2MB • Recommended: 200×50px
                </p>
              </div>
              <button
                type="button"
                className="ml-auto px-3 py-1.5 border border-white/20 text-xs font-mono text-white/60 hover:bg-white/5 transition-colors"
              >
                <Upload className="h-3 w-3 inline mr-1.5" />
                UPLOAD
              </button>
            </>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
    </div>
  )
}
