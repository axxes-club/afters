"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import { MessageSquarePlus, X, Send, Loader2, Upload, Image as ImageIcon, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useUploadThing } from "@/lib/uploadthing-client"

const ACTIVITY_CACHE_KEY = "afters_user_activity"
const MAX_CACHED_ACTIVITIES = 50

interface CachedActivity {
  action: string
  path: string
  timestamp: number
  metadata?: Record<string, unknown>
}

// Utility to cache user activity in localStorage
export function cacheActivity(action: string, metadata?: Record<string, unknown>) {
  if (typeof window === "undefined") return

  try {
    const cached: CachedActivity[] = JSON.parse(localStorage.getItem(ACTIVITY_CACHE_KEY) || "[]")
    cached.push({
      action,
      path: window.location.pathname,
      timestamp: Date.now(),
      metadata,
    })
    // Keep only the last N activities
    const trimmed = cached.slice(-MAX_CACHED_ACTIVITIES)
    localStorage.setItem(ACTIVITY_CACHE_KEY, JSON.stringify(trimmed))
  } catch {
    // Ignore localStorage errors
  }
}

// Get cached activities
function getCachedActivities(): CachedActivity[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_CACHE_KEY) || "[]")
  } catch {
    return []
  }
}

// Clear cached activities after successful submission
function clearCachedActivities() {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACTIVITY_CACHE_KEY)
}

type FeedbackType = "bug" | "feature" | "general"

export function FeedbackButton() {
  const { user } = useUser()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>("general")
  const [message, setMessage] = useState("")
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const { startUpload } = useUploadThing("feedbackScreenshot", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        setScreenshots(prev => [...prev, res[0].url])
      }
      setIsUploading(false)
    },
    onUploadError: () => {
      toast.error("Failed to upload screenshot")
      setIsUploading(false)
    },
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (screenshots.length >= 3) {
      toast.error("Maximum 3 screenshots allowed")
      return
    }

    setIsUploading(true)
    await startUpload(Array.from(files))
    e.target.value = "" // Reset input
  }

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message")
      return
    }

    setIsSubmitting(true)

    try {
      const activities = getCachedActivities()

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: message.trim(),
          screenshotUrls: screenshots,
          activityLog: activities,
          currentPath: pathname,
          userAgent: navigator.userAgent,
        }),
      })

      if (res.ok) {
        toast.success("Feedback submitted! Thank you.")
        clearCachedActivities()
        setMessage("")
        setScreenshots([])
        setType("general")
        setIsOpen(false)
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to submit feedback")
      }
    } catch {
      toast.error("Failed to submit feedback")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 hover:text-[#ff1493] transition-colors"
        title="Send Feedback"
      >
        <MessageSquarePlus className="w-3 h-3" />
        <span>FEEDBACK</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="border-white/10 bg-black max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 text-[#ff1493]" />
              Send Feedback
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Feedback Type */}
            <div className="flex gap-2">
              {(["bug", "feature", "general"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 text-xs font-mono tracking-wider transition-all border ${
                    type === t
                      ? "border-[#ff1493] bg-[#ff1493]/10 text-[#ff1493]"
                      : "border-white/10 text-white/40 hover:border-white/20"
                  }`}
                >
                  {t === "bug" ? "BUG" : t === "feature" ? "FEATURE" : "GENERAL"}
                </button>
              ))}
            </div>

            {/* Message */}
            <div>
              <label className="text-[10px] font-mono text-white/40 tracking-widest mb-1 block">
                MESSAGE
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === "bug"
                    ? "Describe what happened and what you expected..."
                    : type === "feature"
                    ? "Describe the feature you'd like to see..."
                    : "Share your thoughts..."
                }
                rows={4}
                className="bg-black border-white/10 font-mono text-sm placeholder:text-white/20 focus:border-[#ff1493]/30 focus:ring-0 resize-none"
              />
            </div>

            {/* Screenshots */}
            <div>
              <label className="text-[10px] font-mono text-white/40 tracking-widest mb-2 block">
                SCREENSHOTS (optional)
              </label>

              <div className="space-y-2">
                {/* Screenshot previews */}
                {screenshots.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {screenshots.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 border border-white/10 bg-white/5">
                        <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeScreenshot(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                {screenshots.length < 3 && (
                  <label className="flex items-center justify-center gap-2 h-12 border border-dashed border-white/10 text-white/40 hover:text-white hover:border-white/30 cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      className="hidden"
                    />
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span className="text-xs font-mono">
                      {isUploading ? "Uploading..." : "Add screenshot"}
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* User info */}
            {user && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/30 p-2 bg-white/5 border border-white/10">
                <span>Submitting as</span>
                <span className="text-white/50">{user.emailAddresses[0]?.emailAddress}</span>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !message.trim()}
              className="w-full py-3 bg-[#ff1493] text-black font-mono font-bold text-sm tracking-wider hover:bg-[#ff1493]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  SUBMITTING...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  SUBMIT FEEDBACK
                </>
              )}
            </button>

            <p className="text-[10px] text-white/30 font-mono text-center">
              Recent activity will be included to help us debug issues
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
