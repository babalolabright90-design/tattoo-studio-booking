import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import authConfig from "@/auth.config"
import { prisma } from "@/lib/prisma"
import { countHits, recordHit } from "@/lib/rate-limit"

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
})

// Used to keep response time constant when the account does not exist.
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8e0VfDqz6rB0o3Zl5Qy2f0Yw9mYJ7K"

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_WINDOW_SECONDS = 15 * 60

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null
        const { email, password } = parsed.data

        const key = `login:${email}`
        if ((await countHits(key, LOCKOUT_WINDOW_SECONDS)) >= MAX_FAILED_ATTEMPTS) return null

        const user = await prisma.user.findUnique({ where: { email } })
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)

        if (!user || !user.active || user.role !== "ADMIN" || !valid) {
          await recordHit(key)
          return null
        }
        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
})
