import Stripe from "stripe"
import type { Booking, Customer } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getSettings } from "@/lib/settings"
import { siteConfig } from "@/lib/site-config"

export const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY)

let client: Stripe | null = null

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured")
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY)
  return client
}

/** Deposit in minor units for a booking, based on the studio's deposit rule. */
export async function computeDeposit(booking: Pick<Booking, "depositAmount" | "totalPrice">): Promise<number> {
  if (booking.depositAmount !== null && booking.depositAmount !== undefined) return booking.depositAmount
  const settings = await getSettings()
  if (settings.depositType === "NONE") return 0
  if (settings.depositType === "FIXED") return settings.depositAmount
  if (!booking.totalPrice) return 0
  return Math.round((booking.totalPrice * settings.depositAmount) / 100)
}

export function paymentLink(reference: string): string {
  return `${siteConfig.url}/pay/${encodeURIComponent(reference)}`
}

/** Creates a fresh Stripe Checkout session for a booking's deposit. */
export async function createDepositCheckout(booking: Booking & { customer: Customer }) {
  const settings = await getSettings()
  const amount = await computeDeposit(booking)
  if (amount <= 0) throw new Error("No deposit due")

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: booking.customer.email,
    client_reference_id: booking.id,
    metadata: { bookingId: booking.id, reference: booking.reference },
    payment_intent_data: { metadata: { bookingId: booking.id, reference: booking.reference } },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: settings.currency.toLowerCase(),
          unit_amount: amount,
          product_data: {
            name: `Tattoo deposit - ${settings.businessName}`,
            description: `Booking ${booking.reference}`,
          },
        },
      },
    ],
    success_url: `${siteConfig.url}/booking/confirmation?ref=${encodeURIComponent(booking.reference)}&paid=1`,
    cancel_url: `${siteConfig.url}/booking/confirmation?ref=${encodeURIComponent(booking.reference)}`,
  })

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount,
      currency: settings.currency,
      status: "PENDING",
      stripeSessionId: session.id,
      checkoutUrl: session.url,
    },
  })

  return session
}
