"use server"

import { redirect } from "next/navigation"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { bookingSchema } from "@/lib/validation"
import { getSettings } from "@/lib/settings"
import { getSlots } from "@/lib/availability"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { generateReference } from "@/lib/format"
import { toDateOnly, zonedToUtc } from "@/lib/time"
import { MAX_REFERENCE_IMAGES } from "@/lib/constants"
import { isCloudinaryConfigured, uploadImageFile } from "@/lib/cloudinary"
import { notifyAdminNewBooking, notifyCustomer } from "@/lib/email/send"

export type BookingFormState = {
  error?: string
  fieldErrors?: Record<string, string>
}

function isOverlapError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : ""
  return message.includes("Booking_no_overlap") || message.includes("23P01") || message.includes("exclusion constraint")
}

export async function submitBooking(_prev: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const ip = await clientIp()
  if (!(await rateLimit(`booking:${ip}`, 5, 60 * 60))) {
    return { error: "Too many requests. Please try again in a little while." }
  }

  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>
  delete raw.$ACTION_ID

  const parsed = bookingSchema.safeParse(
    Object.fromEntries(
      Object.entries(raw).filter(([k]) => !k.startsWith("$ACTION") && k !== "referenceImages"),
    ),
  )
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form")
      fieldErrors[key] ??= issue.message
    }
    return { error: "Please fix the highlighted fields.", fieldErrors }
  }
  const data = parsed.data
  if (data.website) return { error: "Something went wrong. Please try again." }

  const settings = await getSettings()

  const service = data.serviceId
    ? await prisma.service.findFirst({ where: { id: data.serviceId, active: true } })
    : null
  const duration = service?.durationMinutes ?? settings.defaultDurationMinutes

  const slots = await getSlots({
    dateStr: data.preferredDate,
    artistId: data.artistId === "any" ? null : data.artistId,
    durationMinutes: duration,
  })
  const slot = slots.find((s) => s.time === data.preferredTime)
  if (!slot) {
    return {
      error: "That time is no longer available. Please choose another time.",
      fieldErrors: { preferredTime: "Please choose another time" },
    }
  }
  const artistId = data.artistId === "any" ? slot.artistIds[0] : data.artistId
  if (!slot.artistIds.includes(artistId)) {
    return { error: "That artist is not available at this time.", fieldErrors: { preferredTime: "Please choose another time" } }
  }

  const files = formData
    .getAll("referenceImages")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_REFERENCE_IMAGES)
  const referenceImages: string[] = []
  if (files.length > 0) {
    if (!isCloudinaryConfigured) {
      return { error: "Image uploads are not available right now. Please remove the images or describe them in your notes." }
    }
    try {
      for (const file of files) {
        const uploaded = await uploadImageFile(file, "references")
        referenceImages.push(uploaded.url)
      }
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Image upload failed", fieldErrors: { referenceImages: "Image upload failed" } }
    }
  }

  const startsAt = zonedToUtc(data.preferredDate, data.preferredTime, settings.timezone)
  const endsAt = new Date(startsAt.getTime() + duration * 60000)

  let reference = ""
  try {
    const booking = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { email: data.email },
        update: { name: data.fullName, phone: data.phone },
        create: { email: data.email, name: data.fullName, phone: data.phone },
      })
      return tx.booking.create({
        data: {
          reference: generateReference(),
          customerId: customer.id,
          artistId,
          serviceId: service?.id ?? null,
          style: data.style,
          placement: data.placement,
          size: data.size,
          colorMode: data.colorMode,
          description: data.description,
          budget: data.budget,
          preferredDate: toDateOnly(data.preferredDate),
          alternativeDate: data.alternativeDate ? toDateOnly(data.alternativeDate) : null,
          preferredTime: data.preferredTime,
          startsAt,
          endsAt,
          referenceImages,
          customerNotes: data.customerNotes,
        },
        include: { customer: true, artist: true },
      })
    })
    reference = booking.reference
    await Promise.all([notifyCustomer("submitted", booking), notifyAdminNewBooking(booking)])
  } catch (e) {
    if (isOverlapError(e)) {
      return {
        error: "Someone just booked that time. Please choose another slot.",
        fieldErrors: { preferredTime: "Please choose another time" },
      }
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Something went wrong. Please try again." }
    }
    console.error("submitBooking failed", e)
    return { error: "We could not submit your request. Please try again." }
  }

  redirect(`/booking/confirmation?ref=${encodeURIComponent(reference)}`)
}
