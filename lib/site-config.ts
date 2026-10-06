/**
 * Single source of truth for default branding. Everything here can be overridden
 * with environment variables, and the admin "Settings" page overrides it again
 * at runtime (stored in the SiteSettings table).
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME ?? "Ink & Ember Tattoo Studio",
  shortName: process.env.NEXT_PUBLIC_BUSINESS_SHORT_NAME ?? "Ink & Ember",
  tagline: process.env.NEXT_PUBLIC_BUSINESS_TAGLINE ?? "Your Story. Your Ink.",
  description:
    "Custom tattoo studio specializing in black & grey, realism, fine line and Japanese work. Book your consultation online.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL ?? "hello@example.com",
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? "+1 (555) 014-2290",
  timezone: process.env.NEXT_PUBLIC_BUSINESS_TIMEZONE ?? "America/New_York",
  currency: process.env.NEXT_PUBLIC_BUSINESS_CURRENCY ?? "USD",
} as const

export const defaultBusinessHours = [
  { day: 0, label: "Sunday", open: null, close: null },
  { day: 1, label: "Monday", open: null, close: null },
  { day: 2, label: "Tuesday", open: "11:00", close: "19:00" },
  { day: 3, label: "Wednesday", open: "11:00", close: "19:00" },
  { day: 4, label: "Thursday", open: "11:00", close: "20:00" },
  { day: 5, label: "Friday", open: "11:00", close: "20:00" },
  { day: 6, label: "Saturday", open: "10:00", close: "18:00" },
] as const

export type BusinessHour = {
  day: number
  label: string
  open: string | null
  close: string | null
}
