import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format a date in an event's IANA timezone (servers run in UTC).
// Falls back to America/New_York if the stored timezone is invalid.
export function formatInTimezone(
  date: Date,
  timezone: string | null | undefined,
  options: Intl.DateTimeFormatOptions
): string {
  try {
    return date.toLocaleString("en-US", { ...options, timeZone: timezone || "America/New_York" })
  } catch {
    return date.toLocaleString("en-US", { ...options, timeZone: "America/New_York" })
  }
}
