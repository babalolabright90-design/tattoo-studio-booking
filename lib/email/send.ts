import { Resend } from "resend"
import type { Booking, Customer, Artist, NotificationType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getSettings } from "@/lib/settings"
import { siteConfig } from "@/lib/site-config"
import { formatDateTime } from "@/lib/time"
import { formatMoney } from "@/lib/format"
import { computeDeposit, paymentLink } from "@/lib/stripe"
import * as t from "@/lib/email/templates"

export const isEmailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)

let resend: Resend | null = null

async function deliver(params: {
  to: string
  type: NotificationType
  bookingId?: string
  rendered: t.Rendered
  replyTo?: string
}) {
  const { to, type, bookingId, rendered, replyTo } = params
  let status: "SENT" | "FAILED" | "SKIPPED" = "SKIPPED"
  let error: string | undefined

  if (isEmailConfigured) {
    try {
      resend ??= new Resend(process.env.RESEND_API_KEY)
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM as string,
        to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        replyTo,
      })
      if (result.error) {
        status = "FAILED"
        error = result.error.message
      } else {
        status = "SENT"
      }
    } catch (e) {
      status = "FAILED"
      error = e instanceof Error ? e.message : "Unknown error"
    }
  }

  try {
    await prisma.notification.create({
      data: { type, toEmail: to, subject: rendered.subject, status, error, bookingId },
    })
  } catch (e) {
    console.error("Failed to log notification", e)
  }
}

async function context(): Promise<t.EmailContext> {
  const s = await getSettings()
  return {
    businessName: s.businessName,
    siteUrl: siteConfig.url,
    phone: s.phone,
    email: s.email,
    address: `${s.address}, ${s.city}`,
  }
}

type FullBooking = Booking & { customer: Customer; artist: Artist }

async function toEmailData(booking: FullBooking, extra?: { note?: string | null }): Promise<t.BookingEmailData> {
  const s = await getSettings()
  const deposit = await computeDeposit(booking)
  return {
    reference: booking.reference,
    customerName: booking.customer.name,
    artistName: booking.artist.name,
    style: booking.style,
    placement: booking.placement,
    size: booking.size,
    when: formatDateTime(booking.startsAt, s.timezone),
    note: extra?.note ?? booking.adminNotes,
    amount: deposit > 0 ? formatMoney(deposit, s.currency) : undefined,
    paymentUrl: paymentLink(booking.reference),
  }
}

export type BookingEvent =
  | "submitted"
  | "confirmed"
  | "rejected"
  | "rescheduled"
  | "deposit_requested"
  | "deposit_received"
  | "cancelled"

const eventMap: Record<BookingEvent, { type: NotificationType; render: (c: t.EmailContext, d: t.BookingEmailData) => t.Rendered }> = {
  submitted: { type: "BOOKING_SUBMITTED", render: t.bookingSubmitted },
  confirmed: { type: "BOOKING_CONFIRMED", render: t.bookingConfirmed },
  rejected: { type: "BOOKING_REJECTED", render: t.bookingRejected },
  rescheduled: { type: "BOOKING_RESCHEDULED", render: t.bookingRescheduled },
  deposit_requested: { type: "DEPOSIT_REQUESTED", render: t.depositRequested },
  deposit_received: { type: "DEPOSIT_RECEIVED", render: t.depositReceived },
  cancelled: { type: "BOOKING_CANCELLED", render: t.bookingCancelled },
}

/** Sends the customer email for a booking event. Never throws. */
export async function notifyCustomer(event: BookingEvent, booking: FullBooking, note?: string | null) {
  try {
    const ctx = await context()
    const data = await toEmailData(booking, { note })
    const { type, render } = eventMap[event]
    const s = await getSettings()
    await deliver({ to: booking.customer.email, type, bookingId: booking.id, rendered: render(ctx, data), replyTo: s.email })
  } catch (e) {
    console.error("notifyCustomer failed", e)
  }
}

/** Notifies the studio of a new request. Never throws. */
export async function notifyAdminNewBooking(booking: FullBooking) {
  try {
    const ctx = await context()
    const s = await getSettings()
    const data = await toEmailData(booking)
    await deliver({
      to: process.env.ADMIN_NOTIFICATION_EMAIL || s.email,
      type: "ADMIN_NEW_BOOKING",
      bookingId: booking.id,
      rendered: t.adminNewBooking(ctx, {
        ...data,
        customerEmail: booking.customer.email,
        customerPhone: booking.customer.phone,
        description: booking.description,
      }),
      replyTo: booking.customer.email,
    })
  } catch (e) {
    console.error("notifyAdminNewBooking failed", e)
  }
}

export async function sendContactMessage(input: { name: string; email: string; message: string }) {
  const ctx = await context()
  const s = await getSettings()
  await deliver({
    to: process.env.ADMIN_NOTIFICATION_EMAIL || s.email,
    type: "ADMIN_NEW_BOOKING",
    rendered: t.contactMessage(ctx, input),
    replyTo: input.email,
  })
}
