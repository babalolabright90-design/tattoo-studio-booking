import type { BookingStatus, ColorMode } from "@prisma/client"

export const TATTOO_STYLES = [
  "Black & Grey",
  "Realism",
  "Fine Line",
  "Traditional",
  "Neo Traditional",
  "Japanese",
  "Tribal",
  "Lettering",
  "Minimalist",
  "Cover Up",
  "Custom",
] as const

export const PLACEMENTS = [
  "Forearm",
  "Upper arm",
  "Shoulder",
  "Chest",
  "Back",
  "Rib cage",
  "Thigh",
  "Calf",
  "Ankle / foot",
  "Hand / wrist",
  "Neck",
  "Other",
] as const

export const SIZES = [
  "Tiny (under 5 cm)",
  "Small (5-10 cm)",
  "Medium (10-20 cm)",
  "Large (20-30 cm)",
  "Extra large / sleeve / full back",
] as const

export const BUDGETS = [
  "Under 200",
  "200 - 500",
  "500 - 1,000",
  "1,000 - 2,500",
  "2,500+",
  "Not sure yet",
] as const

export const COLOR_MODE_LABELS: Record<ColorMode, string> = {
  BLACK_GREY: "Black & grey",
  COLOR: "Colour",
  BOTH: "Both / not sure",
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  DEPOSIT_REQUIRED: "Deposit required",
  DEPOSIT_PAID: "Deposit paid",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
}

export const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  CONFIRMED: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  DEPOSIT_REQUIRED: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  DEPOSIT_PAID: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  COMPLETED: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  CANCELLED: "bg-zinc-700/30 text-zinc-400 border-zinc-600/30",
  REJECTED: "bg-red-500/15 text-red-300 border-red-500/30",
}

export const ALL_STATUSES = Object.keys(STATUS_LABELS) as BookingStatus[]

/** Statuses that hold a time slot (and therefore block double-booking). */
export const ACTIVE_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "DEPOSIT_REQUIRED",
  "DEPOSIT_PAID",
]

export const MAX_REFERENCE_IMAGES = 3
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
