import { NextResponse, type NextRequest } from "next/server"
import type Stripe from "stripe"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import { notifyCustomer } from "@/lib/email/send"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!process.env.STRIPE_SECRET_KEY || !secret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 })

  const body = await request.text()
  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status === "paid") {
      const payment = await prisma.payment.findUnique({ where: { stripeSessionId: session.id } })
      if (payment && payment.status !== "PAID") {
        const intent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "PAID", paidAt: new Date(), stripePaymentIntentId: intent ?? null },
        })
        const booking = await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: "DEPOSIT_PAID" },
          include: { customer: true, artist: true },
        })
        await notifyCustomer("deposit_received", booking)
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session
    await prisma.payment.updateMany({
      where: { stripeSessionId: session.id, status: "PENDING" },
      data: { status: "EXPIRED" },
    })
  }

  return NextResponse.json({ received: true })
}
