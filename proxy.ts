import NextAuth from "next-auth"
import authConfig from "@/auth.config"

// Optimistic gate only. Every admin page and server action re-validates the session.
export default NextAuth(authConfig).auth

export const config = {
  matcher: ["/admin/:path*"],
}
