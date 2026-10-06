import { Clock } from "lucide-react"
import { formatMoney } from "@/lib/format"

export type ServiceCardItem = {
  name: string
  description: string
  priceFrom: number
  priceTo: number | null
  durationMinutes: number
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} hr${h > 1 ? "s" : ""}` : `${h} hr ${m} min`
}

export function formatPriceRange(item: Pick<ServiceCardItem, "priceFrom" | "priceTo">, currency: string): string {
  if (item.priceTo && item.priceTo > item.priceFrom) {
    return `${formatMoney(item.priceFrom, currency)} - ${formatMoney(item.priceTo, currency)}`
  }
  return `From ${formatMoney(item.priceFrom, currency)}`
}

export function ServiceCard({ service, currency }: { service: ServiceCardItem; currency: string }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50">
      <h3 className="font-serif text-2xl font-semibold">{service.name}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm">
        <span className="font-medium text-gold">{formatPriceRange(service, currency)}</span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="size-3.5" />
          {formatDuration(service.durationMinutes)}
        </span>
      </div>
    </article>
  )
}
