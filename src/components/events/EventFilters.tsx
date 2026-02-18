"use client"

import { useRouter } from "next/navigation"
import { useOptimistic, useTransition, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const DATE_FILTERS = [
  { label: "Any Date", value: "" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
]

interface EventFiltersProps {
  cities: string[]
  selectedCity: string | null
  dateFilter: string
  searchQuery: string
}

export function EventFilters({
  cities,
  selectedCity,
  dateFilter,
  searchQuery,
}: EventFiltersProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Optimistic state for instant UI feedback
  const [optimisticFilters, setOptimisticFilters] = useOptimistic(
    { city: selectedCity, date: dateFilter },
    (_, newFilters: { city: string | null; date: string }) => newFilters
  )

  const buildUrl = useCallback(
    (overrides: { city?: string | null; date?: string }) => {
      const newParams = new URLSearchParams()

      const city = overrides.city !== undefined ? overrides.city : selectedCity
      const date = overrides.date !== undefined ? overrides.date : dateFilter

      if (city) newParams.set("city", city)
      if (date) newParams.set("date", date)
      if (searchQuery) newParams.set("search", searchQuery)

      const qs = newParams.toString()
      return `/events${qs ? `?${qs}` : ""}`
    },
    [selectedCity, dateFilter, searchQuery]
  )

  const handleFilterClick = (
    type: "city" | "date",
    value: string | null
  ) => {
    const newFilters =
      type === "city"
        ? { city: value, date: optimisticFilters.date }
        : { city: optimisticFilters.city, date: value || "" }

    // Immediately update UI
    setOptimisticFilters(newFilters)

    // Navigate in transition (non-blocking)
    startTransition(() => {
      const url =
        type === "city"
          ? buildUrl({ city: value })
          : buildUrl({ date: value || "" })
      router.push(url, { scroll: false })
    })
  }

  return (
    <div className="space-y-4 mb-8">
      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading events...</span>
        </div>
      )}

      {/* Date Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <span className="text-sm text-muted-foreground self-center mr-2">
          When:
        </span>
        {DATE_FILTERS.map((df) => {
          const isActive =
            optimisticFilters.date === df.value ||
            (!optimisticFilters.date && df.value === "")

          return (
            <Button
              key={df.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterClick("date", df.value || null)}
              className={cn(
                "transition-all duration-150",
                isPending && "opacity-80"
              )}
            >
              {df.label}
            </Button>
          )
        })}
      </div>

      {/* City Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <span className="text-sm text-muted-foreground self-center mr-2">
          Where:
        </span>
        <Button
          variant={!optimisticFilters.city ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterClick("city", null)}
          className={cn(
            "transition-all duration-150",
            isPending && "opacity-80"
          )}
        >
          All Cities
        </Button>
        {cities.map((c) => {
          const isActive = c === optimisticFilters.city

          return (
            <Button
              key={c}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterClick("city", c)}
              className={cn(
                "transition-all duration-150",
                isPending && "opacity-80"
              )}
            >
              {c}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
