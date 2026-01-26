"use client"

import { useEffect } from "react"

interface ViewTrackerProps {
  eventId: string
}

// Generate a simple visitor ID for deduplication
function getVisitorId(): string {
  if (typeof window === "undefined") return ""
  
  // Try to get existing ID from sessionStorage
  let id = sessionStorage.getItem("afters_visitor_id")
  
  if (!id) {
    // Generate a simple random ID
    id = Math.random().toString(36).substring(2) + Date.now().toString(36)
    sessionStorage.setItem("afters_visitor_id", id)
  }
  
  return id
}

export function ViewTracker({ eventId }: ViewTrackerProps) {
  useEffect(() => {
    // Track view after a small delay to ensure it's a real visit
    const timer = setTimeout(() => {
      const visitorId = getVisitorId()
      
      fetch(`/api/events/${eventId}/views`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      }).catch(() => {
        // Silently ignore errors - don't break the page for analytics
      })
    }, 1000) // 1 second delay to filter bots/quick bounces
    
    return () => clearTimeout(timer)
  }, [eventId])
  
  // This component doesn't render anything
  return null
}
