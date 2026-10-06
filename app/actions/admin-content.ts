"use server"

import { revalidatePath } from "next/cache"
import type { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/guards"
import {
  artistSchema,
  availabilityRowSchema,
  blockedDateSchema,
  portfolioSchema,
  serviceSchema,
  settingsSchema,
} from "@/lib/validation"
import { deleteImage, isCloudinaryConfigured, uploadImageFile } from "@/lib/cloudinary"
import { slugify } from "@/lib/format"
import { toDateOnly } from "@/lib/time"
import type { ActionResult } from "@/app/actions/admin-bookings"

function refreshAll() {
  revalidatePath("/", "layout")
}

function firstError(error: z.ZodError): string {
  const issue = error.issues[0]
  return issue ? `${issue.path.join(".") || "Form"}: ${issue.message}` : "Invalid input"
}

async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const root = slugify(base) || "item"
  let slug = root
  let n = 2
  while (await exists(slug)) slug = `${root}-${n++}`
  return slug
}

/* ------------------------------ uploads ------------------------------ */

export async function uploadAdminImage(
  formData: FormData,
): Promise<{ ok: true; url: string; publicId: string } | { ok: false; error: string }> {
  await requireAdmin()
  if (!isCloudinaryConfigured) {
    return { ok: false, error: "Image storage is not configured. Add the Cloudinary environment variables." }
  }
  const file = formData.get("file")
  const folder = String(formData.get("folder") ?? "portfolio").replace(/[^a-z-]/g, "") || "portfolio"
  if (!(file instanceof File)) return { ok: false, error: "No file selected" }
  try {
    const uploaded = await uploadImageFile(file, folder)
    return { ok: true, ...uploaded }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed" }
  }
}

/* ------------------------------ artists ------------------------------ */

export async function saveArtist(id: string | null, input: unknown): Promise<ActionResult> {
  await requireAdmin()
  const parsed = artistSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }
  const data = parsed.data

  if (id) {
    await prisma.artist.update({ where: { id }, data })
  } else {
    const slug = await uniqueSlug(data.name, async (s) => Boolean(await prisma.artist.findUnique({ where: { slug: s } })))
    const count = await prisma.artist.count()
    const artist = await prisma.artist.create({ data: { ...data, slug, sortOrder: count } })
    // New artists start with the studio's default weekly schedule so they are bookable right away.
    await prisma.availability.createMany({
      data: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        artistId: artist.id,
        dayOfWeek: day,
        isWorking: day >= 2 && day <= 6,
        startTime: "11:00",
        endTime: "19:00",
        breakStart: "14:00",
        breakEnd: "15:00",
      })),
    })
  }
  refreshAll()
  return { ok: true, message: "Artist saved." }
}

export async function deleteArtist(id: string): Promise<ActionResult> {
  await requireAdmin()
  const bookings = await prisma.booking.count({ where: { artistId: id } })
  if (bookings > 0) {
    return { ok: false, error: "This artist has bookings and cannot be deleted. Deactivate them instead." }
  }
  const works = await prisma.portfolio.findMany({ where: { artistId: id }, select: { imagePublicId: true } })
  await prisma.artist.delete({ where: { id } })
  await Promise.all(works.map((w) => deleteImage(w.imagePublicId)))
  refreshAll()
  return { ok: true, message: "Artist deleted." }
}

/* ------------------------------ services ------------------------------ */

export async function saveService(id: string | null, input: unknown): Promise<ActionResult> {
  await requireAdmin()
  const parsed = serviceSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }
  const data = parsed.data
  if (id) {
    await prisma.service.update({ where: { id }, data })
  } else {
    const slug = await uniqueSlug(data.name, async (s) => Boolean(await prisma.service.findUnique({ where: { slug: s } })))
    const count = await prisma.service.count()
    await prisma.service.create({ data: { ...data, slug, sortOrder: count } })
  }
  refreshAll()
  return { ok: true, message: "Service saved." }
}

export async function deleteService(id: string): Promise<ActionResult> {
  await requireAdmin()
  await prisma.service.delete({ where: { id } })
  refreshAll()
  return { ok: true, message: "Service deleted." }
}

/* ------------------------------ portfolio ------------------------------ */

export async function savePortfolioItem(id: string | null, input: unknown): Promise<ActionResult> {
  await requireAdmin()
  const parsed = portfolioSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }
  const { tattooedAt, ...rest } = parsed.data
  const data = { ...rest, tattooedAt: toDateOnly(tattooedAt) }

  if (id) {
    const previous = await prisma.portfolio.findUnique({ where: { id }, select: { imagePublicId: true } })
    await prisma.portfolio.update({ where: { id }, data })
    if (previous?.imagePublicId && previous.imagePublicId !== data.imagePublicId) await deleteImage(previous.imagePublicId)
  } else {
    const slug = await uniqueSlug(data.title, async (s) => Boolean(await prisma.portfolio.findUnique({ where: { slug: s } })))
    await prisma.portfolio.create({ data: { ...data, slug } })
  }
  refreshAll()
  return { ok: true, message: "Portfolio item saved." }
}

export async function deletePortfolioItem(id: string): Promise<ActionResult> {
  await requireAdmin()
  const item = await prisma.portfolio.findUnique({ where: { id }, select: { imagePublicId: true } })
  await prisma.portfolio.delete({ where: { id } })
  await deleteImage(item?.imagePublicId)
  refreshAll()
  return { ok: true, message: "Portfolio item deleted." }
}

export async function saveCategory(id: string | null, name: string): Promise<ActionResult> {
  await requireAdmin()
  const clean = name.trim().slice(0, 40)
  if (clean.length < 2) return { ok: false, error: "Enter a category name" }
  try {
    if (id) {
      await prisma.portfolioCategory.update({ where: { id }, data: { name: clean } })
    } else {
      const slug = await uniqueSlug(clean, async (s) => Boolean(await prisma.portfolioCategory.findUnique({ where: { slug: s } })))
      const count = await prisma.portfolioCategory.count()
      await prisma.portfolioCategory.create({ data: { name: clean, slug, sortOrder: count } })
    }
  } catch {
    return { ok: false, error: "A category with that name already exists" }
  }
  refreshAll()
  return { ok: true, message: "Category saved." }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin()
  const used = await prisma.portfolio.count({ where: { categoryId: id } })
  if (used > 0) return { ok: false, error: "This category still has portfolio items." }
  await prisma.portfolioCategory.delete({ where: { id } })
  refreshAll()
  return { ok: true, message: "Category deleted." }
}

/* ------------------------------ availability ------------------------------ */

export async function saveAvailability(artistId: string, rows: unknown): Promise<ActionResult> {
  await requireAdmin()
  if (!Array.isArray(rows) || rows.length !== 7) return { ok: false, error: "Invalid schedule" }
  const parsedRows = []
  for (const row of rows) {
    const parsed = availabilityRowSchema.safeParse(row)
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) }
    parsedRows.push(parsed.data)
  }
  await prisma.$transaction(
    parsedRows.map((row) =>
      prisma.availability.upsert({
        where: { artistId_dayOfWeek: { artistId, dayOfWeek: row.dayOfWeek } },
        update: row,
        create: { ...row, artistId },
      }),
    ),
  )
  refreshAll()
  return { ok: true, message: "Working hours saved." }
}

export async function addBlockedDate(input: unknown): Promise<ActionResult> {
  await requireAdmin()
  const parsed = blockedDateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }
  const { startDate, endDate, ...rest } = parsed.data
  await prisma.blockedDate.create({ data: { ...rest, startDate: toDateOnly(startDate), endDate: toDateOnly(endDate) } })
  refreshAll()
  return { ok: true, message: "Dates blocked." }
}

export async function removeBlockedDate(id: string): Promise<ActionResult> {
  await requireAdmin()
  await prisma.blockedDate.delete({ where: { id } })
  refreshAll()
  return { ok: true, message: "Block removed." }
}

/* ------------------------------ settings ------------------------------ */

export async function saveSettings(input: unknown): Promise<ActionResult> {
  await requireAdmin()
  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) }
  const data = parsed.data
  for (const h of data.businessHours) {
    if ((h.open === null) !== (h.close === null)) return { ok: false, error: `${h.label}: set both opening and closing time, or neither` }
    if (h.open && h.close && h.open >= h.close) return { ok: false, error: `${h.label}: closing must be after opening` }
  }
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  })
  refreshAll()
  return { ok: true, message: "Settings saved." }
}

/* ------------------------------ demo data ------------------------------ */

export async function removeDemoData(): Promise<ActionResult> {
  await requireAdmin()
  await prisma.$transaction([
    prisma.booking.deleteMany({ where: { isDemo: true } }),
    prisma.portfolio.deleteMany({ where: { isDemo: true } }),
    prisma.testimonial.deleteMany({ where: { isDemo: true } }),
    prisma.customer.deleteMany({ where: { isDemo: true } }),
  ])
  const demoArtists = await prisma.artist.findMany({ where: { isDemo: true }, select: { id: true } })
  for (const a of demoArtists) {
    const left = await prisma.booking.count({ where: { artistId: a.id } })
    if (left === 0) await prisma.artist.delete({ where: { id: a.id } })
  }
  await prisma.service.deleteMany({ where: { isDemo: true, bookings: { none: {} } } })
  refreshAll()
  return { ok: true, message: "Demo data removed." }
}
