import type { Metadata } from "next"
import { siteConfig } from "@/lib/site-config"
import type { Settings } from "@/lib/settings"

export function buildMetadata(opts: {
  title: string
  description: string
  path: string
  image?: string | null
  noIndex?: boolean
}): Metadata {
  const url = `${siteConfig.url}${opts.path}`
  const image = opts.image ?? "/images/hero.png"
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      url,
      title: opts.title,
      description: opts.description,
      images: [{ url: image }],
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [image],
    },
  }
}

export function localBusinessJsonLd(s: Settings, image?: string) {
  const sameAs = [s.instagram, s.facebook, s.tiktok, s.twitter].filter(Boolean)
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  return {
    "@context": "https://schema.org",
    "@type": "TattooParlor",
    name: s.businessName,
    description: s.description,
    url: siteConfig.url,
    telephone: s.phone,
    email: s.email,
    image: image ? `${siteConfig.url}${image}` : `${siteConfig.url}/images/hero.png`,
    priceRange: "$$-$$$",
    address: { "@type": "PostalAddress", streetAddress: s.address, addressLocality: s.city },
    sameAs,
    openingHoursSpecification: s.businessHours
      .filter((h) => h.open && h.close)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: dayNames[h.day],
        opens: h.open,
        closes: h.close,
      })),
  }
}

export function servicesJsonLd(
  s: Settings,
  services: { name: string; description: string; priceFrom: number; priceTo: number | null }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((svc, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: svc.name,
        description: svc.description,
        provider: { "@type": "TattooParlor", name: s.businessName, url: siteConfig.url },
        offers: {
          "@type": "Offer",
          priceCurrency: s.currency,
          price: (svc.priceFrom / 100).toFixed(2),
        },
      },
    })),
  }
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  }
}
