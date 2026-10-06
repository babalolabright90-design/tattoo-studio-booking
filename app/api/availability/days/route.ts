import { NextResponse, type NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSettings } from "@/lib/settings"
import { addDaysStr, dayOfWeek, todayInZone, toDateOnly } from "@/lib/time"
import { clientIp, rateLimit } from "@/lib/rate-limit"

/**
 * Returns which weekdays are worked and which dates are fully blocked in the booking window,
 * so the date picker can disable closed days without a request per day.
 */
export async function GET(request: NextRequest) {
  const ip = await clientIp()
  if (!(await rateLimit(`days:${ip}`, 60, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const artistParam = request.nextUrl.searchParams.get("artistId")
  const artistId = artistParam && artistParam !== "any" && artistParam.length < 40 ? artistParam : null

  const settings = await getSettings()
  const today = todayInZone(settings.timezone)
  const last = addDaysStr(today, settings.maxAdvanceDays)

  const [availability, blocks] = await Promise.all([
    prisma.availability.findMany({
      where: { isWorking: true, artist: { active: true, ...(artistId ? { id: artistId } : {}) } },
      select: { dayOfWeek: true },
    }),
    prisma.blockedDate.findMany({
      where: {
        endDate: { gte: toDateOnly(today) },
        startDate: { lte: toDateOnly(last) },
        ...(artistId ? { OR: [{ artistId: null }, { artistId }] } : { artistId: null }),
      },
      select: { startDate: true, endDate: true },
    }),
  ])

  const workingDays = [...new Set(availability.map((a) => a.dayOfWeek))]
  const blocked: string[] = []
  for (const b of blocks) {
    let d = b.startDate.toISOString().slice(0, 10)
    const end = b.endDate.toISOString().slice(0, 10)
    while (d <= end && blocked.length < 800) {
      blocked.push(d)
      d = addDaysStr(d, 1)
    }
  }
  void dayOfWeek

  return NextResponse.json({ today, last, workingDays, blocked })
}
