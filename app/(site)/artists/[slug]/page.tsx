import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { buildMetadata } from "@/lib/seo"
import { initials } from "@/lib/format"
import { PortfolioCard } from "@/components/site/portfolio-card"
import { CtaBanner } from "@/components/site/cta-banner"

type Params = { params: Promise<{ slug: string }> }

async function getArtist(slug: string) {
  return prisma.artist.findFirst({
    where: { slug, active: true },
    include: {
      portfolio: {
        where: { published: true },
        include: { category: true, artist: true },
        orderBy: { tattooedAt: "desc" },
      },
    },
  })
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const artist = await getArtist(slug)
  if (!artist) return {}
  return buildMetadata({
    title: `${artist.name} - ${artist.title}`,
    description: artist.bio.slice(0, 155),
    path: `/artists/${artist.slug}`,
    image: artist.photoUrl,
  })
}

export default async function ArtistPage({ params }: Params) {
  const { slug } = await params
  const artist = await getArtist(slug)
  if (!artist) notFound()

  return (
    <>
      <section className="container-page grid gap-10 py-12 sm:py-20 lg:grid-cols-5">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-card ring-1 ring-border lg:col-span-2">
          {artist.photoUrl ? (
            <Image
              src={artist.photoUrl}
              alt={`Portrait of ${artist.name}`}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center font-serif text-7xl text-muted-foreground">
              {initials(artist.name)}
            </div>
          )}
        </div>
        <div className="lg:col-span-3">
          <p className="eyebrow">{artist.title}</p>
          <h1 className="mt-3 font-serif text-6xl font-semibold sm:text-7xl">{artist.name}</h1>
          <p className="mt-6 max-w-2xl leading-relaxed text-pretty text-muted-foreground">{artist.bio}</p>

          <dl className="mt-8 grid max-w-md grid-cols-2 gap-6 border-y border-border py-6">
            <div>
              <dt className="text-xs tracking-widest text-muted-foreground uppercase">Experience</dt>
              <dd className="mt-1 font-serif text-3xl">{artist.yearsExp}+ years</dd>
            </div>
            <div>
              <dt className="text-xs tracking-widest text-muted-foreground uppercase">Pieces</dt>
              <dd className="mt-1 font-serif text-3xl">{artist.portfolio.length}</dd>
            </div>
          </dl>

          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Specialties">
            {artist.specialties.map((s) => (
              <li key={s}>
                <Badge variant="outline">{s}</Badge>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={`/booking?artist=${artist.id}`}>Book with {artist.name.split(" ")[0]}</Link>
            </Button>
            {artist.instagram && (
              <Button asChild size="lg" variant="outline">
                <a href={artist.instagram} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="container-page pb-8">
        <h2 className="font-serif text-4xl font-semibold">Portfolio</h2>
        {artist.portfolio.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No portfolio pieces published yet.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artist.portfolio.map((p) => (
              <li key={p.id}>
                <PortfolioCard item={p} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <CtaBanner />
    </>
  )
}
