"use client"

import { cn } from "@/lib/utils"

export function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card overflow-hidden animate-pulse",
        className
      )}
    >
      {/* Image placeholder */}
      <div className="w-full aspect-[4/3] bg-muted" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Organizer */}
        <div className="h-4 w-24 bg-muted rounded" />

        {/* Title */}
        <div className="h-6 w-full bg-muted rounded" />

        {/* Meta info */}
        <div className="flex items-center gap-4">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>

        {/* Price */}
        <div className="h-5 w-16 bg-muted rounded" />
      </div>
    </div>
  )
}

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}
