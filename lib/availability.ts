import { prisma } from "@/lib/prisma"
import { getSettings } from "@/lib/settings"
import { ACTIVE_STATUSES } from "@/lib/constants"
import {
  addDaysStr,
  dayOfWeek,
  isValidDateStr,
  minutesToTime,
  timeToMinutes,
  toDateOnly,
  todayInZone,
  zonedToUtc,
} from "@/lib/time"

export type Slot = { time: string; artistIds: string[] }

/**
 * Returns the bookable start times for a date. When `artistId` is omitted, the slots of
 * every active artist are merged and each slot lists the artists who are free.
 */
export async function getSlots(params: {
  dateStr: string
  artistId?: string | null
  durationMinutes?: number
  ignoreBookingId?: string
  ignoreNotice?: boolean
}): Promise<Slot[]> {
  const { dateStr, artistId, ignoreBookingId, ignoreNotice } = params
  if (!isValidDateStr(dateStr)) return []

  const settings = await getSettings()
  const duration = params.durationMinutes ?? settings.defaultDurationMinutes
  const tz = settings.timezone

  const today = todayInZone(tz)
  if (dateStr < today) return []
  if (!ignoreNotice && dateStr > addDaysStr(today, settings.maxAdvanceDays)) return []

  const artists = await prisma.artist.findMany({
    where: { active: true, ...(artistId ? { id: artistId } : {}) },
    select: { id: true },
  })
  if (artists.length === 0) return []
  const artistIds = artists.map((a) => a.id)

  const dayStart = zonedToUtc(dateStr, "00:00", tz)
  const dayEnd = zonedToUtc(addDaysStr(dateStr, 1), "00:00", tz)
  const dateOnly = toDateOnly(dateStr)

  const [availability, blocks, bookings] = await Promise.all([
    prisma.availability.findMany({ where: { artistId: { in: artistIds }, dayOfWeek: dayOfWeek(dateStr) } }),
    prisma.blockedDate.findMany({
      where: {
        startDate: { lte: dateOnly },
        endDate: { gte: dateOnly },
        OR: [{ artistId: null }, { artistId: { in: artistIds } }],
      },
    }),
    prisma.booking.findMany({
      where: {
        artistId: { in: artistIds },
        status: { in: ACTIVE_STATUSES },
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
        ...(ignoreBookingId ? { id: { not: ignoreBookingId } } : {}),
      },
      select: { artistId: true, startsAt: true, endsAt: true },
    }),
  ])

  if (blocks.some((b) => b.artistId === null)) return []

  const earliest = ignoreNotice ? new Date(0) : new Date(Date.now() + settings.minNoticeHours * 3600 * 1000)
  const interval = Math.max(15, settings.slotIntervalMinutes)
  const merged = new Map<string, string[]>()

  for (const id of artistIds) {
    const row = availability.find((a) => a.artistId === id)
    if (!row || !row.isWorking) continue
    if (blocks.some((b) => b.artistId === id)) continue

    const open = timeToMinutes(row.startTime)
    const close = timeToMinutes(row.endTime)
    const breakStart = row.breakStart ? timeToMinutes(row.breakStart) : null
    const breakEnd = row.breakEnd ? timeToMinutes(row.breakEnd) : null
    const mine = bookings.filter((b) => b.artistId === id)

    for (let start = open; start + duration <= close; start += interval) {
      const end = start + duration
      if (breakStart !== null && breakEnd !== null && start < breakEnd && end > breakStart) continue

      const time = minutesToTime(start)
      const startsAt = zonedToUtc(dateStr, time, tz)
      const endsAt = new Date(startsAt.getTime() + duration * 60000)
      if (startsAt < earliest) continue
      if (mine.some((b) => b.startsAt < endsAt && b.endsAt > startsAt)) continue

      merged.set(time, [...(merged.get(time) ?? []), id])
    }
  }

  return [...merged.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, ids]) => ({ time, artistIds: ids }))
}

/** Convenience helper for the public booking form: just the times. */
export async function getSlotTimes(params: Parameters<typeof getSlots>[0]): Promise<string[]> {
  return (await getSlots(params)).map((s) => s.time)
}
