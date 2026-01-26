import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { formatCents } from "@/lib/stripe"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EventFilters } from "@/components/events/EventFilters"
import { CalendarDays, MapPin, Search, ChevronLeft, ChevronRight } from "lucide-react"

// Ensure dynamic rendering for fresh city filters
export const dynamic = "force-dynamic"
export const revalidate = 0

const ITEMS_PER_PAGE = 12

const DATE_FILTERS = [
  { label: "Any Date", value: "" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
]

function getDateRange(filter: string): { start: Date; end?: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (filter) {
    case "today":
      const endOfDay = new Date(start)
      endOfDay.setDate(endOfDay.getDate() + 1)
      return { start, end: endOfDay }
    case "week":
      const endOfWeek = new Date(start)
      endOfWeek.setDate(endOfWeek.getDate() + 7)
      return { start, end: endOfWeek }
    case "month":
      const endOfMonth = new Date(start)
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)
      return { start, end: endOfMonth }
    default:
      return { start }
  }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    city?: string
    search?: string
    date?: string
    page?: string 
  }>
}) {
  const params = await searchParams
  const selectedCity = params.city && params.city !== "all" ? params.city : null
  const searchQuery = params.search || ""
  const dateFilter = params.date || ""
  const currentPage = Math.max(1, parseInt(params.page || "1", 10))

  // Get unique cities from events
  const citiesResult = await prisma.event.groupBy({
    by: ["city"],
    where: {
      isPublished: true,
      status: "PUBLISHED",
      startsAt: { gte: new Date() },
    },
    orderBy: { city: "asc" },
  })
  const cities = citiesResult.map((c) => c.city)

  // Build date filter
  const dateRange = getDateRange(dateFilter)
  const dateWhere = dateFilter
    ? {
        startsAt: {
          gte: dateRange.start,
          ...(dateRange.end && { lt: dateRange.end }),
        },
      }
    : {
        startsAt: { gte: new Date() },
      }

  // Build where clause
  const where = {
    isPublished: true,
    status: "PUBLISHED" as const,
    ...dateWhere,
    ...(selectedCity && { city: selectedCity }),
    ...(searchQuery && {
      OR: [
        { title: { contains: searchQuery, mode: "insensitive" as const } },
        { venueName: { contains: searchQuery, mode: "insensitive" as const } },
        { description: { contains: searchQuery, mode: "insensitive" as const } },
      ],
    }),
  }

  // Get total count for pagination
  const totalCount = await prisma.event.count({ where })
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Fetch events with pagination
  const events = await prisma.event.findMany({
    where,
    include: {
      organizer: {
        select: {
          displayName: true,
          slug: true,
        },
      },
      ticketTiers: {
        where: { isVisible: true },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
    orderBy: { startsAt: "asc" },
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
  })

  type EventType = (typeof events)[number]

  // Build URL with current filters
  function buildUrl(overrides: Record<string, string | undefined>) {
    const newParams = new URLSearchParams()
    const merged = { 
      city: selectedCity || undefined, 
      search: searchQuery || undefined, 
      date: dateFilter || undefined,
      page: currentPage > 1 ? String(currentPage) : undefined,
      ...overrides 
    }
    
    for (const [key, value] of Object.entries(merged)) {
      if (value && value !== "1") {
        newParams.set(key, value)
      }
    }
    
    const qs = newParams.toString()
    return `/events${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 pb-8 pt-24">
        <h1 className="text-3xl font-bold mb-6">Discover Events</h1>

        {/* Search Bar */}
        <form action="/events" method="GET" className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="search"
              type="search"
              placeholder="Search events, venues..."
              defaultValue={searchQuery}
              className="pl-10"
            />
            {/* Preserve other filters */}
            {selectedCity && <input type="hidden" name="city" value={selectedCity} />}
            {dateFilter && <input type="hidden" name="date" value={dateFilter} />}
          </div>
        </form>

        {/* Filters - Client component for instant feedback */}
        <EventFilters
          cities={cities}
          selectedCity={selectedCity}
          dateFilter={dateFilter}
          searchQuery={searchQuery}
        />

        {/* Results summary */}
        {(searchQuery || selectedCity || dateFilter) && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalCount} event{totalCount !== 1 ? "s" : ""} found
              {searchQuery && ` for "${searchQuery}"`}
              {selectedCity && ` in ${selectedCity}`}
              {dateFilter && ` (${DATE_FILTERS.find((d) => d.value === dateFilter)?.label.toLowerCase()})`}
            </p>
            {(searchQuery || selectedCity || dateFilter) && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/events">Clear filters</Link>
              </Button>
            )}
          </div>
        )}

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No events found{selectedCity ? ` in ${selectedCity}` : ""}.</p>
            <p className="mt-2 text-sm">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event: EventType) => {
              const lowestPrice = event.ticketTiers[0]?.price || 0

              return (
                <Link
                  key={event.id}
                  href={`/e/${event.organizer.slug}-${event.slug}`}
                  className="group block rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {event.flyerUrl ? (
                    <div className="relative w-full aspect-[4/3]">
                      <Image
                        src={event.flyerUrl}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <CalendarDays className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      {event.organizer.displayName}
                    </p>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(event.startsAt).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.city}
                      </span>
                    </div>
                    <p className="mt-3 font-medium">
                      {lowestPrice === 0 ? "Free" : `From ${formatCents(lowestPrice)}`}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              asChild={currentPage > 1}
            >
              {currentPage > 1 ? (
                <Link href={buildUrl({ page: String(currentPage - 1) })}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Link>
              ) : (
                <span>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </span>
              )}
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "ghost"}
                    size="sm"
                    className="w-9"
                    asChild={pageNum !== currentPage}
                  >
                    {pageNum !== currentPage ? (
                      <Link href={buildUrl({ page: String(pageNum) })}>{pageNum}</Link>
                    ) : (
                      <span>{pageNum}</span>
                    )}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              asChild={currentPage < totalPages}
            >
              {currentPage < totalPages ? (
                <Link href={buildUrl({ page: String(currentPage + 1) })}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              ) : (
                <span>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Page info */}
        {totalPages > 1 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Page {currentPage} of {totalPages} ({totalCount} events)
          </p>
        )}
      </main>
    </div>
  )
}
