import { NextResponse, type NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createDepositCheckout, isStripeConfigured } from "@/lib/stripe"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { siteConfig } from "@/lib/site-config"

export const runtime = "nodejs"

/** Customer-facing deposit link. Creates a fresh Stripe Checkout session and redirects to it. */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ reference: string }> }) {
  const { reference } = await ctx.params
  const back = (query: string) => NextResponse.redirect(`${siteConfig.url}/booking/confirmation?ref=${encodeURIComponent(reference)}${query}`)

  const ip = await clientIp()
  if (!(await rateLimit(`pay:${ip}`, 20, 60 * 10))) return back("&error=rate")
  if (!isStripeConfigured) return back("&error=payments")

  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: { customer: true },
  })
  if (!booking || booking.status !== "DEPOSIT_REQUIRED") return back("")

  try {
    const session = await createDepositCheckout(booking)
    if (!session.url) return back("&error=payments")
    return NextResponse.redirect(session.url)
  } catch (e) {
    console.error("pay route failed", e)
    return back("&error=payments")
  }
}
