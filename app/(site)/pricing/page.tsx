import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { getSettings } from "@/lib/settings"
import { buildMetadata } from "@/lib/seo"
import { formatMoney } from "@/lib/format"
import { PageHero } from "@/components/site/section-heading"
import { CtaBanner } from "@/components/site/cta-banner"
import { formatDuration, formatPriceRange } from "@/components/site/service-card"

export const metadata: Metadata = buildMetadata({
  title: "Tattoo Pricing",
  description: "Transparent tattoo pricing, deposit information and what to expect when booking.",
  path: "/pricing",
})

export default async function PricingPage() {
  const [settings, services] = await Promise.all([
    getSettings(),
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ])
  const deposit =
    settings.depositType === "NONE"
      ? "No deposit is required to secure your appointment."
      : settings.depositType === "FIXED"
        ? `A ${formatMoney(settings.depositAmount, settings.currency)} deposit secures your appointment and is deducted from your final price.`
        : `A ${settings.depositAmount / 100}% deposit secures your appointment and is deducted from your final price.`

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Honest, upfront pricing"
        description="Every tattoo is unique, so final quotes are given after your consultation. These are our starting points."
      />
      <section className="container-page py-14">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Service prices</caption>
            <thead className="bg-card text-xs tracking-widest text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="px-5 py-4 font-medium">Service</th>
                <th scope="col" className="px-5 py-4 font-medium">Duration</th>
                <th scope="col" className="px-5 py-4 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((s) => (
                <tr key={s.id}>
                  <th scope="row" className="px-5 py-4 align-top font-normal">
                    <p className="font-serif text-xl">{s.name}</p>
                    <p className="mt-1 max-w-md text-muted-foreground">{s.description}</p>
                  </th>
                  <td className="px-5 py-4 align-top whitespace-nowrap text-muted-foreground">
                    {formatDuration(s.durationMinutes)}
                  </td>
                  <td className="px-5 py-4 text-right align-top whitespace-nowrap font-medium text-gold">
                    {formatPriceRange(s, settings.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            ["Deposit", deposit],
            ["Final quote", "Your artist confirms the price after reviewing your design, placement and size. There are no surprises on the day."],
            ["Cancellations", "Please give at least 48 hours notice to reschedule. Late cancellations may forfeit the deposit."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-serif text-2xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
      <CtaBanner />
    </>
  )
}
