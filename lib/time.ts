/**
 * Timezone helpers built on Intl so we need no extra dependency.
 * Appointments are stored as UTC instants but are always created and displayed in the
 * studio's configured timezone.
 */

function tzOffsetMs(timestamp: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(timestamp))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"))
  return asUtc - Math.floor(timestamp / 1000) * 1000
}

/** Convert a wall-clock date ("2026-03-14") + time ("14:30") in `timeZone` to a UTC Date. */
export function zonedToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  const [hh, mm] = timeStr.split(":").map(Number)
  const guess = Date.UTC(y, m - 1, d, hh, mm)
  let result = guess - tzOffsetMs(guess, timeZone)
  result = guess - tzOffsetMs(result, timeZone)
  return new Date(result)
}

export function isValidDateStr(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value)
}

export function isValidTimeStr(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

/** Date-only value for Prisma `@db.Date` columns. */
export function toDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

export function dayOfWeek(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00.000Z`).getUTCDay()
}

export function dateToStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return dateToStr(d)
}

/** Today's date string in the given timezone. */
export function todayInZone(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

export function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number)
  return h * 60 + m
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function formatDateTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export function formatDate(date: Date, timeZone = "UTC"): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function formatTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

/** "14:30" -> "2:30 PM" */
export function formatTimeStr(value: string): string {
  const [h, m] = value.split(":").map(Number)
  const suffix = h >= 12 ? "PM" : "AM"
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`
}

/** The wall-clock date string (YYYY-MM-DD) of an instant in the zone. */
export function instantToZonedDateStr(date: Date, timeZone: string): string {
  return todayInZone(timeZone, date)
}

export function instantToZonedTimeStr(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
