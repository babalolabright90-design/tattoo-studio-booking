import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { buildMetadata } from "@/lib/seo"
import { formatDate } from "@/lib/time"
import { PortfolioCard } from "@/components/site/portfolio-card"
import { CtaBanner } from "@/components/site/cta-banner"

type Params = { params: Promise<{ slug: string }> }

async function getItem(slug: string) {
  return prisma.portfolio.findFirst({
    where: { slug, published: true },
    include: { category: true, artist: true },
  })
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const item = await getItem(slug)
  if (!item) return {}
  return buildMetadata({
    title: `${item.title} - ${item.category.name} Tattoo`,
    description: item.description.slice(0, 155),
    path: `/portfolio/${item.slug}`,
    image: item.imageUrl,
  })
}

export default async function TattooPage({ params }: Params) {
  const { slug } = await params
  const item = await getItem(slug)
  if (!item) notFound()

  const related = await prisma.portfolio.findMany({
    where: { published: true, id: { not: item.id }, OR: [{ categoryId: item.categoryId }, { artistId: item.artistId }] },
    include: { category: true, artist: true },
    orderBy: { tattooedAt: "desc" },
    take: 3,
  })

  return (
    <>
      <article className="container-page py-8 sm:py-14">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-6">
          <Link href="/portfolio">
            <ArrowLeft className="size-4" /> Back to portfolio
          </Link>
        </Button>
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="overflow-hidden rounded-lg ring-1 ring-border lg:col-span-3">
            <Image
              src={item.imageUrl}
              alt={`${item.title}, ${item.category.name} tattoo by ${item.artist.name}`}
              width={1200}
              height={1200}
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="h-auto w-full object-cover"
            />
          </div>
          <div className="lg:col-span-2">
            <p className="eyebrow">{item.category.name}</p>
            <h1 className="mt-3 font-serif text-5xl font-semibold text-balance">{item.title}</h1>
            <p className="mt-5 leading-relaxed text-pretty text-muted-foreground">{item.description}</p>

            <dl className="mt-8 divide-y divide-border border-y border-border text-sm">
              <div className="flex justify-between py-3">
                <dt className="text-muted-foreground">Artist</dt>
                <dd>
                  <Link href={`/artists/${item.artist.slug}`} className="text-primary hover:underline">
                    {item.artist.name}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-muted-foreground">Style</dt>
                <dd>
                  <Link href={`/portfolio?style=${item.category.slug}`} className="hover:underline">
                    {item.category.name}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-muted-foreground">Date</dt>
                <dd>{formatDate(item.tattooedAt)}</dd>
              </div>
            </dl>

            {item.tags.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tags">
                {item.tags.map((t) => (
                  <li key={t}>
                    <Badge variant="secondary">#{t}</Badge>
                  </li>
                ))}
              </ul>
            )}

            <Button asChild size="lg" className="mt-8 w-full sm:w-auto">
              <Link href={`/booking?artist=${item.artist.id}&style=${encodeURIComponent(item.category.name)}`}>
                Book something like this
              </Link>
            </Button>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="container-page pb-8">
          <h2 className="font-serif text-3xl font-semibold">More work you may like</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <li key={r.id}>
                <PortfolioCard item={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <CtaBanner />
    </>
  )
}
