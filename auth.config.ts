import type { NextAuthConfig } from "next-auth"

const isDev = process.env.NODE_ENV === "development"

/**
 * In development the v0 preview renders the app inside a cross-site iframe, so session
 * cookies need SameSite=None; Secure to survive. Production uses Auth.js defaults.
 */
const devCookies: NextAuthConfig["cookies"] = isDev
  ? {
      sessionToken: {
        name: "__Secure-authjs.session-token",
        options: { httpOnly: true, sameSite: "none", path: "/", secure: true },
      },
      callbackUrl: {
        name: "__Secure-authjs.callback-url",
        options: { sameSite: "none", path: "/", secure: true },
      },
      csrfToken: {
        name: "__Host-authjs.csrf-token",
        options: { httpOnly: true, sameSite: "none", path: "/", secure: true },
      },
    }
  : undefined

export default {
  trustHost: true,
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  cookies: devCookies,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      if (!pathname.startsWith("/admin") || pathname === "/admin/login") return true
      return Boolean(auth?.user)
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
