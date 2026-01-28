"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

interface SaveEventButtonProps {
  eventId: string
  initialIsSaved: boolean
  className?: string
  variant?: "icon" | "button"
}

export function SaveEventButton({ 
  eventId, 
  initialIsSaved, 
  className,
  variant = "icon"
}: SaveEventButtonProps) {
  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const [isLoading, setIsLoading] = useState(false)
  const { isSignedIn } = useAuth()
  const router = useRouter()

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isSignedIn) {
      router.push("/sign-in")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/user/save-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle save")
      }

      const data = await response.json()
      setIsSaved(data.saved)
      toast.success(data.saved ? "Added to watch list" : "Removed from watch list")
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  if (variant === "button") {
    return (
      <button
        onClick={handleToggleSave}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md border transition-colors",
          isSaved 
            ? "bg-[#ff1493]/10 border-[#ff1493] text-[#ff1493]" 
            : "border-white/10 hover:border-[#ff1493]/50 text-white/60 hover:text-white",
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSaved ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
        <span>{isSaved ? "Saved" : "Save Event"}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleToggleSave}
      disabled={isLoading}
      className={cn(
        "p-2 rounded-full transition-all bg-black/50 backdrop-blur-md border border-white/10 hover:border-[#ff1493]/50",
        isSaved ? "text-[#ff1493]" : "text-white/60 hover:text-white",
        className
      )}
      title={isSaved ? "Remove from watch list" : "Save to watch list"}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isSaved ? (
        <BookmarkCheck className="w-5 h-5 fill-[#ff1493]/20" />
      ) : (
        <Bookmark className="w-5 h-5" />
      )}
    </button>
  )
}
