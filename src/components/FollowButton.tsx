"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@clerk/nextjs"

interface FollowButtonProps {
  organizerId: string
  initialIsFollowing: boolean
  className?: string
}

export function FollowButton({ organizerId, initialIsFollowing, className }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const { isSignedIn } = useAuth()
  const router = useRouter()

  const handleToggleFollow = async () => {
    if (!isSignedIn) {
      router.push("/sign-in")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/user/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizerId }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle follow")
      }

      const data = await response.json()
      setIsFollowing(data.following)
      toast.success(data.following ? "Following" : "Unfollowed")
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className={className}
      onClick={handleToggleFollow}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : isFollowing ? (
        <UserCheck className="w-4 h-4 mr-2 text-[#ff1493]" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  )
}
