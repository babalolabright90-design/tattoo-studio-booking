import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { buildMetadata } from "@/lib/seo"
import { PageHero } from "@/components/site/section-heading"
import { ArtistCard } from "@/components/site/artist-card"
import { CtaBanner } from "@/components/site/cta-banner"

export const metadata: Metadata = buildMetadata({
  title: "Our Tattoo Artists",
  description: "Meet the tattoo artists at our studio and explore their specialties and portfolios.",
  path: "/artists",
})

export default async function ArtistsPage() {
  const artists = await prisma.artist.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } })
  return (
    <>
      <PageHero
        eyebrow="Artists"
        title="Meet the artists"
        description="Every artist has their own voice. Find the one whose work matches the story you want to tell."
      />
      <section className="container-page py-14">
        {artists.length === 0 ? (
          <p className="text-muted-foreground">Our artist roster is being updated. Please check back soon.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        )}
      </section>
      <CtaBanner />
    </>
  )
}
