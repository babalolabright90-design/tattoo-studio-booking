import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"
import { socialLinks, type Settings } from "@/lib/settings"

export function SiteFooter({ settings }: { settings: Settings }) {
  const socials = socialLinks(settings)
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-border bg-sidebar">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-serif text-2xl font-semibold">{settings.businessName}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{settings.description}</p>
          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-4 text-sm">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="eyebrow">Explore</p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {[
              ["/portfolio", "Portfolio"],
              ["/artists", "Artists"],
              ["/services", "Services"],
              ["/pricing", "Pricing"],
              ["/booking", "Book a Tattoo"],
              ["/faq", "FAQ"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-foreground">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Visit</p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                {settings.address}, {settings.city}
              </span>
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
              <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="hover:text-foreground">
                {settings.phone}
              </a>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
              <a href={`mailto:${settings.email}`} className="break-all hover:text-foreground">
                {settings.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>
            &copy; {year} {settings.businessName}. All rights reserved.
          </p>
          <p className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms &amp; Conditions
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
