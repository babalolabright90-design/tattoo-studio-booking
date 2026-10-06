import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

/**
 * Database-backed sliding-window rate limiter. Works across serverless instances
 * (an in-memory counter would not). Returns true when the request is allowed.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const since = new Date(Date.now() - windowSeconds * 1000)
  const count = await prisma.rateLimitHit.count({ where: { key, createdAt: { gte: since } } })
  if (count >= limit) return false
  await prisma.rateLimitHit.create({ data: { key } })
  // Opportunistic cleanup keeps the table small.
  if (Math.random() < 0.02) {
    await prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } } })
  }
  return true
}

export async function countHits(key: string, windowSeconds: number): Promise<number> {
  const since = new Date(Date.now() - windowSeconds * 1000)
  return prisma.rateLimitHit.count({ where: { key, createdAt: { gte: since } } })
}

export async function recordHit(key: string): Promise<void> {
  await prisma.rateLimitHit.create({ data: { key } })
}

export async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"
}
