import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { initials } from "@/lib/format"

export type ArtistCardItem = {
  slug: string
  name: string
  title: string
  photoUrl: string | null
  specialties: string[]
}

export function ArtistCard({ artist }: { artist: ArtistCardItem }) {
  return (
    <Link href={`/artists/${artist.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-card ring-1 ring-border">
        {artist.photoUrl ? (
          <Image
            src={artist.photoUrl}
            alt={`Portrait of ${artist.name}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-serif text-6xl text-muted-foreground">
            {initials(artist.name)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="font-serif text-3xl font-semibold">{artist.name}</p>
          <p className="text-sm text-muted-foreground">{artist.title}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {artist.specialties.slice(0, 3).map((s) => (
              <Badge key={s} variant="outline" className="border-foreground/30 bg-background/40 backdrop-blur">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
