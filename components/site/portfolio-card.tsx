import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

export type PortfolioCardItem = {
  slug: string
  title: string
  imageUrl: string
  category: { name: string }
  artist: { name: string }
}

export function PortfolioCard({
  item,
  className,
  priority = false,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
  item: PortfolioCardItem
  className?: string
  priority?: boolean
  sizes?: string
}) {
  return (
    <Link
      href={`/portfolio/${item.slug}`}
      className={cn("group relative block overflow-hidden rounded-lg bg-card ring-1 ring-border", className)}
    >
      <Image
        src={item.imageUrl}
        alt={`${item.title}, ${item.category.name} tattoo by ${item.artist.name}`}
        width={800}
        height={800}
        sizes={sizes}
        priority={priority}
        className="aspect-square h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="eyebrow text-[0.65rem]">{item.category.name}</p>
        <p className="mt-1 font-serif text-xl font-semibold">{item.title}</p>
        <p className="text-xs text-muted-foreground">by {item.artist.name}</p>
      </div>
    </Link>
  )
}
