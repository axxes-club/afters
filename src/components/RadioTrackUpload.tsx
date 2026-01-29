"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useUploadThing } from "@/lib/uploadthing-client"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2, Music, Image as ImageIcon } from "lucide-react"

interface AudioUploadProps {
  onUploadComplete: (data: { url: string; duration: number }) => void
  disabled?: boolean
}

export function AudioUpload({ onUploadComplete, disabled }: AudioUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const { startUpload } = useUploadThing("radioTrack", {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.ufsUrl) {
        const url = res[0].ufsUrl
        // Duration was already calculated and passed via metadata
        onUploadComplete({ url, duration: 0 }) // Duration comes from audio element
        setError(null)
      }
      setIsUploading(false)
      setUploadProgress(0)
    },
    onUploadError: (err) => {
      setError(err.message || "Upload failed")
      setIsUploading(false)
      setUploadProgress(0)
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress)
    },
  })

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration))
      }
      audio.onerror = () => {
        resolve(0)
      }
      audio.src = URL.createObjectURL(file)
    })
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return
      if (disabled) return

      const file = acceptedFiles[0]
      setFileName(file.name)
      setError(null)
      setIsUploading(true)

      // Get audio duration
      const duration = await getAudioDuration(file)

      // Start upload
      const result = await startUpload([file])
      
      if (result?.[0]?.ufsUrl) {
        onUploadComplete({ url: result[0].ufsUrl, duration })
      }
    },
    [startUpload, disabled, onUploadComplete]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"],
    },
    maxFiles: 1,
    maxSize: 64 * 1024 * 1024, // 64MB
    disabled: disabled || isUploading,
  })

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`
          relative flex flex-col items-center justify-center gap-3 p-6
          rounded-lg border-2 border-dashed transition-colors cursor-pointer
          ${isDragActive ? "border-[#ff1493] bg-[#ff1493]/10" : "border-muted-foreground/25 hover:border-[#ff1493]/50"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-[#ff1493]" />
            <div className="text-center">
              <p className="text-sm font-medium">Uploading {fileName}...</p>
              <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
            </div>
            <div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#ff1493] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="p-4 rounded-full bg-[#ff1493]/10">
              <Music className="h-8 w-8 text-[#ff1493]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragActive ? "Drop your audio file here" : "Drag & drop your audio file"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP3, WAV, M4A, AAC, OGG, FLAC (max 64MB)
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Choose Audio File
            </Button>
          </>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

interface ArtworkUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}

export function ArtworkUpload({ value, onChange, disabled }: ArtworkUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { startUpload } = useUploadThing("radioArtwork", {
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
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      setError(null)
      setIsUploading(true)

      await startUpload([file])
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

  if (preview) {
    return (
      <div className="relative group w-32 h-32">
        <div className="relative w-full h-full rounded-lg overflow-hidden border border-border bg-muted">
          <img
            src={preview}
            alt="Track artwork preview"
            className="w-full h-full object-cover"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>
        {!disabled && !isUploading && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={removeImage}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`
          relative flex flex-col items-center justify-center gap-2 p-4
          w-32 h-32 rounded-lg border-2 border-dashed transition-colors cursor-pointer
          ${isDragActive ? "border-[#ff1493] bg-[#ff1493]/10" : "border-muted-foreground/25 hover:border-[#ff1493]/50"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-[10px] text-center text-muted-foreground">
              Artwork
            </p>
          </>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
