import { RRule, Frequency, Weekday, rrulestr } from "rrule"

/**
 * Supported recurrence patterns
 */
export type RecurrencePattern =
  | "weekly"
  | "biweekly"
  | "monthly-by-day" // e.g., "first Saturday"
  | "monthly-by-date" // e.g., "15th of every month"
  | "custom"

export interface RecurrenceConfig {
  pattern: RecurrencePattern
  dayOfWeek?: number // 0-6 (Monday-Sunday in RRule format)
  weekOfMonth?: number // 1-5 (1st, 2nd, 3rd, 4th, last)
  dayOfMonth?: number // 1-31
  interval?: number // For custom patterns
  startsAt: Date
  endsAt?: Date
  maxOccurrences?: number
}

// RRule uses MO=0 through SU=6
const WEEKDAY_MAP = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU]

/**
 * Build an RRULE string from a recurrence configuration
 */
export function buildRRule(config: RecurrenceConfig): string {
  const { pattern, dayOfWeek, weekOfMonth, dayOfMonth, interval, startsAt, endsAt, maxOccurrences } = config

  const rule: Partial<{
    freq: Frequency
    interval: number
    byweekday: Weekday | Weekday[]
    bymonthday: number
    dtstart: Date
    until: Date
    count: number
  }> = {
    dtstart: startsAt,
  }

  if (endsAt) {
    rule.until = endsAt
  }

  if (maxOccurrences) {
    rule.count = maxOccurrences
  }

  switch (pattern) {
    case "weekly":
      rule.freq = Frequency.WEEKLY
      rule.interval = 1
      if (dayOfWeek !== undefined) {
        rule.byweekday = WEEKDAY_MAP[dayOfWeek]
      }
      break

    case "biweekly":
      rule.freq = Frequency.WEEKLY
      rule.interval = 2
      if (dayOfWeek !== undefined) {
        rule.byweekday = WEEKDAY_MAP[dayOfWeek]
      }
      break

    case "monthly-by-day":
      rule.freq = Frequency.MONTHLY
      rule.interval = 1
      if (dayOfWeek !== undefined && weekOfMonth !== undefined) {
        // weekOfMonth: 1-4 means 1st-4th, 5 means last (-1)
        const nthWeek = weekOfMonth === 5 ? -1 : weekOfMonth
        rule.byweekday = WEEKDAY_MAP[dayOfWeek].nth(nthWeek)
      }
      break

    case "monthly-by-date":
      rule.freq = Frequency.MONTHLY
      rule.interval = 1
      if (dayOfMonth !== undefined) {
        rule.bymonthday = dayOfMonth
      }
      break

    case "custom":
      rule.freq = Frequency.WEEKLY
      rule.interval = interval || 1
      if (dayOfWeek !== undefined) {
        rule.byweekday = WEEKDAY_MAP[dayOfWeek]
      }
      break
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rrule = new RRule(rule as any)
  return rrule.toString()
}

/**
 * Generate occurrence dates from an RRULE string
 */
export function generateOccurrences(
  rruleString: string,
  options: {
    after?: Date
    before?: Date
    count?: number
  } = {}
): Date[] {
  const rule = rrulestr(rruleString)
  const { after, before, count = 8 } = options

  // Get occurrences
  if (after && before) {
    return rule.between(after, before, true)
  } else if (after) {
    return rule.after(after, true) ? [rule.after(after, true) as Date, ...rule.between(after, new Date(after.getTime() + 365 * 24 * 60 * 60 * 1000), false).slice(0, count - 1)] : []
  } else {
    return rule.all((_, i) => i < count)
  }
}

/**
 * Generate the next N occurrences starting from now (or a specific date)
 */
export function getNextOccurrences(
  rruleString: string,
  count: number = 8,
  fromDate: Date = new Date()
): Date[] {
  const rule = rrulestr(rruleString)
  
  // Get occurrences after the fromDate
  const futureDate = new Date(fromDate.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year ahead
  const occurrences = rule.between(fromDate, futureDate, true)
  
  return occurrences.slice(0, count)
}

/**
 * Get a human-readable description of the recurrence pattern
 */
export function getRecurrenceDescription(rruleString: string): string {
  try {
    const rule = rrulestr(rruleString)
    return rule.toText()
  } catch {
    return "Custom recurrence"
  }
}

/**
 * Validate an RRULE string
 */
export function isValidRRule(rruleString: string): boolean {
  try {
    rrulestr(rruleString)
    return true
  } catch {
    return false
  }
}

/**
 * Generate a slug with date suffix for series occurrences
 */
export function generateSeriesSlug(baseSlug: string, date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${baseSlug}-${year}-${month}-${day}`
}

/**
 * Day of week options for UI
 */
export const DAYS_OF_WEEK = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
]

/**
 * Week of month options for UI
 */
export const WEEKS_OF_MONTH = [
  { value: 1, label: "First" },
  { value: 2, label: "Second" },
  { value: 3, label: "Third" },
  { value: 4, label: "Fourth" },
  { value: 5, label: "Last" },
]
