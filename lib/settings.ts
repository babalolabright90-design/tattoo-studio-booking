import { cache } from "react"
import type { SiteSettings } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { defaultBusinessHours, siteConfig, type BusinessHour } from "@/lib/site-config"

export type Settings = Omit<SiteSettings, "businessHours" | "updatedAt"> & {
  businessHours: BusinessHour[]
}

const fallback: Settings = {
  id: "default",
  businessName: siteConfig.name,
  tagline: siteConfig.tagline,
  description: siteConfig.description,
  logoUrl: null,
  email: siteConfig.email,
  phone: siteConfig.phone,
  address: "214 Mercer Street",
  city: "New York, NY 10012",
  mapEmbedUrl: null,
  instagram: null,
  facebook: null,
  tiktok: null,
  twitter: null,
  timezone: siteConfig.timezone,
  currency: siteConfig.currency,
  depositType: "FIXED",
  depositAmount: 10000,
  slotIntervalMinutes: 60,
  defaultDurationMinutes: 120,
  minNoticeHours: 48,
  maxAdvanceDays: 120,
  businessHours: [...defaultBusinessHours],
}

export const getSettings = cache(async (): Promise<Settings> => {
  const row = await prisma.siteSettings.findUnique({ where: { id: "default" } })
  if (!row) return fallback
  const { updatedAt: _updatedAt, businessHours, ...rest } = row
  void _updatedAt
  const hours = Array.isArray(businessHours) ? (businessHours as unknown as BusinessHour[]) : fallback.businessHours
  return { ...rest, businessHours: hours }
})

export function socialLinks(settings: Settings) {
  return [
    { label: "Instagram", href: settings.instagram },
    { label: "Facebook", href: settings.facebook },
    { label: "TikTok", href: settings.tiktok },
    { label: "X", href: settings.twitter },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href))
}
