import { Header } from "@/components/layout/header"
import { EventGridSkeleton } from "@/components/events/EventCardSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function EventsLoading() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 pb-8" style={{ marginTop: 60 }}>
        <h1 className="text-3xl font-bold mb-6">Discover Events</h1>

        {/* Search skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-full max-w-md" />
        </div>

        {/* Filter skeletons */}
        <div className="space-y-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>

        {/* Events grid skeleton */}
        <EventGridSkeleton count={6} />
      </main>
    </div>
  )
}
