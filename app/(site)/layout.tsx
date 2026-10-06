import { SiteHeader } from "@/components/site/header"
import { SiteFooter } from "@/components/site/footer"
import { getSettings } from "@/lib/settings"

export const dynamic = "force-dynamic"

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()
  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <SiteHeader name={settings.businessName} logoUrl={settings.logoUrl} />
      <main id="content">{children}</main>
      <SiteFooter settings={settings} />
    </>
  )
}
