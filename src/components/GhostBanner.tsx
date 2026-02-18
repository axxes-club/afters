"use client"

import { useState, useEffect } from "react"
import { Ghost, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface GhostState {
  userId: string
  email: string
  name: string
  adminId: string
}

// Height of the ghost banner for layout offset
const GHOST_BANNER_HEIGHT = 44 // px

export function GhostBanner() {
  const [ghosting, setGhosting] = useState<GhostState | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check ghost status on mount
    fetch('/api/admin/ghost')
      .then(res => res.json())
      .then(data => {
        if (data.ghosting) {
          setGhosting(data.ghosting)
          // Add padding to body to push content down
          document.body.style.paddingTop = `${GHOST_BANNER_HEIGHT}px`
        }
      })
      .catch(() => {})

    // Cleanup on unmount
    return () => {
      document.body.style.paddingTop = ''
    }
  }, [])

  // Update body padding when ghosting state changes
  useEffect(() => {
    if (ghosting) {
      document.body.style.paddingTop = `${GHOST_BANNER_HEIGHT}px`
    } else {
      document.body.style.paddingTop = ''
    }
  }, [ghosting])

  const endGhostSession = async () => {
    setLoading(true)
    try {
      await fetch('/api/admin/ghost', { method: 'DELETE' })
      document.body.style.paddingTop = ''
      setGhosting(null)
      toast.success('Ghost session ended')
      // Reload to refresh user context
      window.location.href = '/superadmin/users'
    } catch {
      toast.error('Failed to end ghost session')
    }
    setLoading(false)
  }

  if (!ghosting) return null

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] bg-purple-600 text-white"
      style={{ height: GHOST_BANNER_HEIGHT }}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ghost className="h-5 w-5 animate-pulse" />
          <span className="text-sm font-medium">
            Ghosting as: <strong>{ghosting.name || ghosting.email}</strong>
          </span>
          <span className="text-xs opacity-75 hidden sm:inline">({ghosting.email})</span>
        </div>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={endGhostSession}
          disabled={loading}
          className="h-7 text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          Exit Ghost Mode
        </Button>
      </div>
    </div>
  )
}
