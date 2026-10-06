import { Star } from "lucide-react"

export type TestimonialItem = { id: string; name: string; quote: string; rating: number; detail: string | null }

export function Testimonials({ items }: { items: TestimonialItem[] }) {
  if (items.length === 0) return null
  return (
    <ul className="grid gap-5 md:grid-cols-3">
      {items.map((t) => (
        <li key={t.id}>
          <figure className="flex h-full flex-col rounded-lg border border-border bg-card p-6">
            <div className="flex gap-0.5 text-gold" role="img" aria-label={`${t.rating} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={i < t.rating ? "size-4 fill-current" : "size-4 opacity-25"} />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 font-serif text-xl leading-snug text-pretty">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 text-sm">
              <span className="font-medium">{t.name}</span>
              {t.detail && <span className="text-muted-foreground"> &middot; {t.detail}</span>}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  )
}
