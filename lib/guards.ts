import { redirect } from "next/navigation"
import { auth } from "@/auth"

/** For admin pages: redirects to login when not authenticated. */
export async function requireAdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/admin/login")
  return session.user
}

/** For server actions and route handlers: throws when not authenticated. */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  return session.user
}
