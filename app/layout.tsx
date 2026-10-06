import type { Metadata, Viewport } from "next"
import { Cormorant_Garamond, Inter } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { siteConfig } from "@/lib/site-config"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} | ${siteConfig.tagline}`, template: `%s | ${siteConfig.shortName}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [{ url: "/images/hero.png", width: 1024, height: 1024, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: ["/images/hero.png"],
  },
}

export const viewport: Viewport = {
  themeColor: "#161618",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} dark`}>
      <body>
        {children}
        <Toaster richColors theme="dark" position="top-center" />
      </body>
    </html>
  )
}
