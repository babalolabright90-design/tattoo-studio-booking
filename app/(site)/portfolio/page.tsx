import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { buildMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"
import { PageHero } from "@/components/site/section-heading"
import { PortfolioCard } from "@/components/site/portfolio-card"
import { CtaBanner } from "@/components/site/cta-banner"

export const metadata: Metadata = buildMetadata({
  title: "Tattoo Portfolio",
  description: "Browse our tattoo portfolio by style: black & grey, realism, fine line, Japanese, traditional and more.",
  path: "/portfolio",
})

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ style?: string }> }) {
  const { style } = await searchParams
  const categories = await prisma.portfolioCategory.findMany({ orderBy: { sortOrder: "asc" } })
  const active = categories.find((c) => c.slug === style)
  const items = await prisma.portfolio.findMany({
    where: { published: true, ...(active ? { categoryId: active.id } : {}) },
    include: { category: true, artist: true },
    orderBy: { tattooedAt: "desc" },
  })

  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title="Work that lasts a lifetime"
        description="A selection of recent healed and fresh pieces by our artists. Filter by style to find what speaks to you."
      />
      <section className="container-page py-10 sm:py-14">
        <nav aria-label="Filter by style" className="-mx-4 overflow-x-auto px-4 pb-2">
          <ul className="flex w-max gap-2">
            <li>
              <FilterLink href="/portfolio" active={!active}>
                All
              </FilterLink>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <FilterLink href={`/portfolio?style=${c.slug}`} active={active?.id === c.id}>
                  {c.name}
                </FilterLink>
              </li>
            ))}
          </ul>
        </nav>

        {items.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-border p-12 text-center">
            <p className="font-serif text-2xl">No pieces in this style yet</p>
            <p className="mt-2 text-muted-foreground">Check back soon, or view the full portfolio.</p>
            <Link href="/portfolio" className="mt-4 inline-block text-primary underline-offset-4 hover:underline">
              View all work
            </Link>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item, i) => (
              <li key={item.id}>
                <PortfolioCard item={item} priority={i < 4} sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" />
              </li>
            ))}
          </ul>
        )}
      </section>
      <CtaBanner />
    </>
  )
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  )
}
