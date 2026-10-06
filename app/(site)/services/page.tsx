import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { getSettings } from "@/lib/settings"
import { buildMetadata, servicesJsonLd } from "@/lib/seo"
import { JsonLd } from "@/components/site/json-ld"
import { PageHero } from "@/components/site/section-heading"
import { ServiceCard } from "@/components/site/service-card"
import { CtaBanner } from "@/components/site/cta-banner"

export const metadata: Metadata = buildMetadata({
  title: "Tattoo Services",
  description: "Custom tattoos, flash, cover-ups, touch-ups and consultations. Explore our services and starting prices.",
  path: "/services",
})

export default async function ServicesPage() {
  const [settings, services] = await Promise.all([
    getSettings(),
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ])
  return (
    <>
      <JsonLd data={servicesJsonLd(settings, services)} />
      <PageHero
        eyebrow="Services"
        title="Everything from first line to final touch-up"
        description="Whether it is your first tattoo or your fiftieth, we have a service built around your idea."
      />
      <section className="container-page py-14">
        {services.length === 0 ? (
          <p className="text-muted-foreground">Our services list is being updated.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} currency={settings.currency} />
            ))}
          </div>
        )}
      </section>
      <CtaBanner />
    </>
  )
}
