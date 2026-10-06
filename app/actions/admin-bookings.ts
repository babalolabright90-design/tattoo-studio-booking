"use server"

import { revalidatePath } from "next/cache"
import type { BookingStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/guards"
import { confirmBookingSchema, rescheduleSchema } from "@/lib/validation"
import { getSettings } from "@/lib/settings"
import { getSlots } from "@/lib/availability"
import { notifyCustomer } from "@/lib/email/send"
import { isStripeConfigured } from "@/lib/stripe"
import { toDateOnly, zonedToUtc } from "@/lib/time"
import { ALL_STATUSES } from "@/lib/constants"
import { sanitizeText } from "@/lib/format"

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string }

const include = { customer: true, artist: true } as const

function refresh() {
  revalidatePath("/admin", "layout")
}

function isOverlapError(error: unknown) {
  const message = error instanceof Error ? error.message : ""
  return message.includes("Booking_no_overlap") || message.includes("23P01") || message.includes("exclusion constraint")
}

/** Approve a request. Moves to "Deposit required" when a deposit applies and Stripe is available. */
export async function confirmBooking(input: {
  bookingId: string
  totalPrice: number | null
  depositAmount: number | null
  adminNotes?: string
}): Promise<ActionResult> {
  await requireAdmin()
  const parsed = confirmBookingSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  const { bookingId, totalPrice, depositAmount, adminNotes } = parsed.data

  const existing = await prisma.booking.findUnique({ where: { id: bookingId } })
  if (!existing) return { ok: false, error: "Booking not found" }
  if (!["PENDING", "CONFIRMED"].includes(existing.status)) return { ok: false, error: "This booking can no longer be confirmed" }

  const settings = await getSettings()
  let deposit = depositAmount
  if (deposit === null) {
    if (settings.depositType === "FIXED") deposit = settings.depositAmount
    else if (settings.depositType === "PERCENTAGE" && totalPrice) deposit = Math.round((totalPrice * settings.depositAmount) / 100)
    else deposit = 0
  }
  const needsDeposit = deposit > 0 && isStripeConfigured

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: needsDeposit ? "DEPOSIT_REQUIRED" : "CONFIRMED",
      totalPrice,
      depositAmount: deposit,
      ...(adminNotes ? { adminNotes } : {}),
    },
    include,
  })

  await notifyCustomer(needsDeposit ? "deposit_requested" : "confirmed", booking, booking.adminNotes)
  refresh()
  return {
    ok: true,
    message: needsDeposit ? "Confirmed. Deposit link emailed to the customer." : "Booking confirmed and customer notified.",
  }
}

export async function rejectBooking(bookingId: string, reason?: string): Promise<ActionResult> {
  await requireAdmin()
  const existing = await prisma.booking.findUnique({ where: { id: bookingId } })
  if (!existing) return { ok: false, error: "Booking not found" }
  const note = reason ? sanitizeText(reason, 1000) : null
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "REJECTED", ...(note ? { adminNotes: note } : {}) },
    include,
  })
  await notifyCustomer("rejected", booking, note)
  refresh()
  return { ok: true, message: "Booking rejected and customer notified." }
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<ActionResult> {
  await requireAdmin()
  const existing = await prisma.booking.findUnique({ where: { id: bookingId } })
  if (!existing) return { ok: false, error: "Booking not found" }
  const note = reason ? sanitizeText(reason, 1000) : null
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED", ...(note ? { adminNotes: note } : {}) },
    include,
  })
  await notifyCustomer("cancelled", booking, note)
  refresh()
  return { ok: true, message: "Booking cancelled and customer notified." }
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<ActionResult> {
  await requireAdmin()
  if (!ALL_STATUSES.includes(status)) return { ok: false, error: "Invalid status" }
  try {
    await prisma.booking.update({ where: { id: bookingId }, data: { status } })
  } catch (e) {
    if (isOverlapError(e)) return { ok: false, error: "That time overlaps another active booking for this artist." }
    return { ok: false, error: "Could not update the status" }
  }
  refresh()
  return { ok: true, message: "Status updated." }
}

export async function saveBookingNotes(bookingId: string, adminNotes: string): Promise<ActionResult> {
  await requireAdmin()
  await prisma.booking.update({ where: { id: bookingId }, data: { adminNotes: sanitizeText(adminNotes, 2000) || null } })
  refresh()
  return { ok: true, message: "Notes saved." }
}

export async function rescheduleBooking(input: {
  bookingId: string
  artistId: string
  date: string
  time: string
}): Promise<ActionResult> {
  await requireAdmin()
  const parsed = rescheduleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  const { bookingId, artistId, date, time } = parsed.data

  const existing = await prisma.booking.findUnique({ where: { id: bookingId } })
  if (!existing) return { ok: false, error: "Booking not found" }

  const settings = await getSettings()
  const duration = Math.round((existing.endsAt.getTime() - existing.startsAt.getTime()) / 60000)
  const slots = await getSlots({ dateStr: date, artistId, durationMinutes: duration, ignoreBookingId: bookingId, ignoreNotice: true })
  if (!slots.some((s) => s.time === time)) return { ok: false, error: "That time is not available for this artist." }

  const startsAt = zonedToUtc(date, time, settings.timezone)
  try {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        artistId,
        startsAt,
        endsAt: new Date(startsAt.getTime() + duration * 60000),
        preferredDate: toDateOnly(date),
        preferredTime: time,
      },
      include,
    })
    await notifyCustomer("rescheduled", booking)
  } catch (e) {
    if (isOverlapError(e)) return { ok: false, error: "That time overlaps another booking." }
    console.error("reschedule failed", e)
    return { ok: false, error: "Could not reschedule the booking" }
  }
  refresh()
  return { ok: true, message: "Booking rescheduled and customer notified." }
}

export async function saveCustomerNotes(customerId: string, notes: string): Promise<ActionResult> {
  await requireAdmin()
  await prisma.customer.update({ where: { id: customerId }, data: { notes: sanitizeText(notes, 3000) || null } })
  refresh()
  return { ok: true, message: "Customer notes saved." }
}

export async function getRescheduleSlots(input: { bookingId: string; artistId: string; date: string }): Promise<string[]> {
  await requireAdmin()
  const existing = await prisma.booking.findUnique({ where: { id: input.bookingId } })
  if (!existing) return []
  const duration = Math.round((existing.endsAt.getTime() - existing.startsAt.getTime()) / 60000)
  const slots = await getSlots({
    dateStr: input.date,
    artistId: input.artistId,
    durationMinutes: duration,
    ignoreBookingId: input.bookingId,
    ignoreNotice: true,
  })
  return slots.map((s) => s.time)
}
