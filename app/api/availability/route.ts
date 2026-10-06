import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { getSlots } from "@/lib/availability"
import { prisma } from "@/lib/prisma"
import { getSettings } from "@/lib/settings"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { isValidDateStr } from "@/lib/time"

const querySchema = z.object({
  date: z.string().refine(isValidDateStr),
  artistId: z.string().max(40).optional(),
  serviceId: z.string().max(40).optional(),
})

export async function GET(request: NextRequest) {
  const ip = await clientIp()
  if (!(await rateLimit(`slots:${ip}`, 120, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 })

  const { date, artistId, serviceId } = parsed.data
  const settings = await getSettings()
  const service = serviceId
    ? await prisma.service.findFirst({ where: { id: serviceId, active: true }, select: { durationMinutes: true } })
    : null

  const slots = await getSlots({
    dateStr: date,
    artistId: artistId && artistId !== "any" ? artistId : null,
    durationMinutes: service?.durationMinutes ?? settings.defaultDurationMinutes,
  })
  return NextResponse.json({ slots: slots.map((s) => s.time) })
}
