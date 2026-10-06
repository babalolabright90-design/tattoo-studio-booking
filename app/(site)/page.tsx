import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { getSettings, socialLinks } from "@/lib/settings"
import { localBusinessJsonLd, servicesJsonLd } from "@/lib/seo"
import { JsonLd } from "@/components/site/json-ld"
import { SectionHeading } from "@/components/site/section-heading"
import { PortfolioCard } from "@/components/site/portfolio-card"
import { ArtistCard } from "@/components/site/artist-card"
import { ServiceCard } from "@/components/site/service-card"
import { Testimonials } from "@/components/site/testimonials"
import { CtaBanner } from "@/components/site/cta-banner"
import { MapSection } from "@/components/site/map-section"

export default async function HomePage() {
  const [settings, featured, categories, artists, services, testimonials] = await Promise.all([
    getSettings(),
    prisma.portfolio.findMany({
      where: { published: true, featured: true },
      include: { category: true, artist: true },
      orderBy: { tattooedAt: "desc" },
      take: 6,
    }),
    prisma.portfolioCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.artist.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, take: 3 }),
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, take: 6 }),
    prisma.testimonial.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 3 }),
  ])
  const socials = socialLinks(settings)

  return (
    <>
      <JsonLd data={localBusinessJsonLd(settings)} />
      <JsonLd data={servicesJsonLd(settings, services)} />

      <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden border-b border-border/60">
        <Image
          src="/images/hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-center opacity-60"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/60 to-background/20" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        <div className="container-page pb-16 pt-32 sm:pb-24">
          <p className="eyebrow animate-fade-up">{settings.businessName}</p>
          <h1 className="animate-fade-up mt-4 max-w-4xl font-serif text-6xl leading-[0.95] font-semibold text-balance sm:text-8xl lg:text-9xl">
            Your Story.
            <br />
            <span className="text-primary">Your Ink.</span>
          </h1>
          <p className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-pretty text-foreground/80">
            {settings.description}
          </p>
          <div className="animate-fade-up mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/booking">Book a Tattoo</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 bg-background/40 px-8 text-base backdrop-blur">
              <Link href="/portfolio">View Portfolio</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-page py-20 sm:py-28">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading eyebrow="Featured work" title="Recent pieces from the studio" />
          <Button asChild variant="ghost" className="self-start sm:self-auto">
            <Link href="/portfolio">
              Full portfolio <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {featured.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item, i) => (
              <PortfolioCard key={item.id} item={item} priority={i < 3} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-muted-foreground">Featured work will appear here soon.</p>
        )}
      </section>

      <section className="border-y border-border/60 bg-sidebar py-20 sm:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow="Tattoo styles"
            title="Every style, done with intent"
            description="From delicate fine line to bold Japanese sleeves, browse the work by style."
          />
          <ul className="mt-10 flex flex-wrap gap-3">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/portfolio?style=${c.slug}`}
                  className="inline-flex rounded-full border border-border bg-card px-5 py-2.5 text-sm transition-colors hover:border-primary hover:text-primary"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-20 sm:py-28">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading eyebrow="The artists" title="Meet the hands behind the ink" />
          <Button asChild variant="ghost" className="self-start sm:self-auto">
            <Link href="/artists">
              All artists <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((a) => (
            <ArtistCard key={a.id} artist={a} />
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-sidebar py-20 sm:py-28">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading eyebrow="Services" title="What we offer" />
            <Button asChild variant="ghost" className="self-start sm:self-auto">
              <Link href="/pricing">
                See pricing <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} currency={settings.currency} />
            ))}
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="container-page py-20 sm:py-28">
          <SectionHeading eyebrow="Kind words" title="Stories from our clients" align="center" />
          <div className="mt-12">
            <Testimonials items={testimonials} />
          </div>
        </section>
      )}

      <CtaBanner />

      {socials.length > 0 && (
        <section className="container-page pb-4">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center">
            <p className="eyebrow">Follow the work</p>
            <ul className="flex flex-wrap justify-center gap-3">
              {socials.map((s) => (
                <li key={s.label}>
                  <Button asChild variant="outline">
                    <a href={s.href} target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="container-page py-20 sm:py-28">
        <SectionHeading eyebrow="Visit the studio" title="Find us" className="mb-10" />
        <MapSection settings={settings} />
      </section>
    </>
  )
}
