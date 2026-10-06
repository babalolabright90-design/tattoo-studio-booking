import { z } from "zod"
import { isValidDateStr, isValidTimeStr } from "@/lib/time"
import { sanitizeText } from "@/lib/format"

const text = (min: number, max: number) =>
  z
    .string()
    .transform((v) => sanitizeText(v, max))
    .pipe(z.string().min(min, min > 0 ? `Please enter at least ${min} characters` : undefined).max(max))

const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? sanitizeText(v, max) : undefined))
    .transform((v) => (v ? v : undefined))

const dateStr = z.string().refine(isValidDateStr, "Enter a valid date")
const timeStr = z.string().refine(isValidTimeStr, "Enter a valid time")

export const bookingSchema = z
  .object({
    fullName: text(2, 100),
    email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
    phone: z
      .string()
      .trim()
      .regex(/^[+()\-.\s\d]{7,25}$/, "Enter a valid phone number"),
    artistId: z.string().min(1, "Choose an artist or no preference"),
    serviceId: optionalText(40),
    style: text(2, 60),
    placement: text(2, 60),
    size: text(2, 80),
    colorMode: z.enum(["BLACK_GREY", "COLOR", "BOTH"]),
    description: text(20, 3000),
    budget: optionalText(60),
    preferredDate: dateStr,
    alternativeDate: z
      .string()
      .optional()
      .transform((v) => (v ? v : undefined))
      .refine((v) => v === undefined || isValidDateStr(v), "Enter a valid date"),
    preferredTime: timeStr,
    customerNotes: optionalText(1500),
    website: z.string().max(0).optional(), // honeypot
    agree: z.literal("on", { error: "You must accept the booking terms" }),
  })
  .strict()

export type BookingInput = z.infer<typeof bookingSchema>

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
})

export const contactSchema = z.object({
  name: text(2, 100),
  email: z.string().trim().toLowerCase().email().max(254),
  message: text(10, 3000),
  website: z.string().max(0).optional(),
})

const cents = z.coerce.number().int().min(0).max(100_000_000)

export const artistSchema = z.object({
  name: text(2, 100),
  title: text(2, 80),
  bio: text(10, 3000),
  photoUrl: optionalText(500),
  specialties: z.array(z.string().trim().min(1).max(40)).max(12),
  instagram: optionalText(200),
  yearsExp: z.coerce.number().int().min(0).max(80),
  active: z.boolean(),
})

export const serviceSchema = z
  .object({
    name: text(2, 100),
    description: text(10, 1000),
    priceFrom: cents,
    priceTo: z
      .union([z.literal(""), cents])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    durationMinutes: z.coerce.number().int().min(15).max(1440),
    active: z.boolean(),
  })
  .refine((v) => v.priceTo === null || v.priceTo >= v.priceFrom, {
    message: "Maximum price must be at least the starting price",
    path: ["priceTo"],
  })

export const portfolioSchema = z.object({
  title: text(2, 120),
  description: text(5, 2000),
  imageUrl: z.string().min(1).max(600),
  imagePublicId: optionalText(300),
  categoryId: z.string().min(1),
  artistId: z.string().min(1),
  tags: z.array(z.string().trim().min(1).max(30)).max(15),
  tattooedAt: dateStr,
  featured: z.boolean(),
  published: z.boolean(),
})

export const availabilityRowSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isWorking: z.boolean(),
    startTime: timeStr,
    endTime: timeStr,
    breakStart: z.string().nullable(),
    breakEnd: z.string().nullable(),
  })
  .refine((v) => v.startTime < v.endTime, { message: "Closing time must be after opening time", path: ["endTime"] })
  .refine(
    (v) =>
      (v.breakStart === null && v.breakEnd === null) ||
      (v.breakStart !== null &&
        v.breakEnd !== null &&
        isValidTimeStr(v.breakStart) &&
        isValidTimeStr(v.breakEnd) &&
        v.breakStart < v.breakEnd),
    { message: "Enter a valid break", path: ["breakEnd"] },
  )

export const blockedDateSchema = z
  .object({
    artistId: z.string().nullable(),
    type: z.enum(["DAY_OFF", "VACATION", "HOLIDAY"]),
    startDate: dateStr,
    endDate: dateStr,
    reason: optionalText(200),
  })
  .refine((v) => v.endDate >= v.startDate, { message: "End date must be on or after the start date", path: ["endDate"] })

export const settingsSchema = z.object({
  businessName: text(2, 100),
  tagline: text(2, 120),
  description: text(10, 500),
  logoUrl: optionalText(600),
  email: z.string().trim().email().max(254),
  phone: text(5, 40),
  address: text(2, 200),
  city: text(2, 120),
  mapEmbedUrl: optionalText(1000).refine((v) => !v || v.startsWith("https://www.google.com/maps/embed"), {
    message: "Use a Google Maps embed URL (https://www.google.com/maps/embed...)",
  }),
  instagram: optionalText(300),
  facebook: optionalText(300),
  tiktok: optionalText(300),
  twitter: optionalText(300),
  timezone: z.string().refine((tz) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz })
      return true
    } catch {
      return false
    }
  }, "Unknown timezone"),
  currency: z.string().length(3).toUpperCase(),
  depositType: z.enum(["NONE", "FIXED", "PERCENTAGE"]),
  depositAmount: z.coerce.number().int().min(0).max(100_000_000),
  slotIntervalMinutes: z.coerce.number().int().min(15).max(240),
  defaultDurationMinutes: z.coerce.number().int().min(30).max(1440),
  minNoticeHours: z.coerce.number().int().min(0).max(24 * 60),
  maxAdvanceDays: z.coerce.number().int().min(7).max(730),
  businessHours: z
    .array(
      z.object({
        day: z.number().int().min(0).max(6),
        label: z.string(),
        open: z.string().nullable(),
        close: z.string().nullable(),
      }),
    )
    .length(7),
})

export const confirmBookingSchema = z.object({
  bookingId: z.string().min(1),
  totalPrice: z.union([z.null(), cents]),
  depositAmount: z.union([z.null(), cents]),
  adminNotes: optionalText(2000),
})

export const rescheduleSchema = z.object({
  bookingId: z.string().min(1),
  artistId: z.string().min(1),
  date: dateStr,
  time: timeStr,
})
