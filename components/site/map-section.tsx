import { Clock, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatTimeStr } from "@/lib/time"
import type { Settings } from "@/lib/settings"

export function MapSection({ settings }: { settings: Settings }) {
  const query = encodeURIComponent(`${settings.address}, ${settings.city}`)
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-6 rounded-lg border border-border bg-card p-6 lg:col-span-2">
        <div className="flex gap-3">
          <MapPin className="mt-1 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Studio address</p>
            <p className="text-sm text-muted-foreground">
              {settings.address}
              <br />
              {settings.city}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Phone className="mt-1 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Call us</p>
            <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="text-sm text-muted-foreground hover:text-foreground">
              {settings.phone}
            </a>
          </div>
        </div>
        <div className="flex gap-3">
          <Clock className="mt-1 size-5 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="font-medium">Opening hours</p>
            <dl className="mt-2 space-y-1 text-sm">
              {settings.businessHours.map((h) => (
                <div key={h.day} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{h.label}</dt>
                  <dd>{h.open && h.close ? `${formatTimeStr(h.open)} - ${formatTimeStr(h.close)}` : "Closed"}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <Button asChild variant="outline" className="w-full">
          <a href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noopener noreferrer">
            Get directions
          </a>
        </Button>
      </div>
      <div className="min-h-80 overflow-hidden rounded-lg border border-border bg-card lg:col-span-3">
        {settings.mapEmbedUrl ? (
          <iframe
            title={`Map showing ${settings.businessName}`}
            src={settings.mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="size-full min-h-80 border-0 grayscale invert-[0.9] contrast-[0.9]"
          />
        ) : (
          <iframe
            title={`Map showing ${settings.businessName}`}
            src={`https://maps.google.com/maps?q=${query}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="size-full min-h-80 border-0 grayscale invert-[0.9] contrast-[0.9]"
          />
        )}
      </div>
    </div>
  )
}
