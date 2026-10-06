"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const links = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/artists", label: "Artists" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export function SiteHeader({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${name} home`}>
          {logoUrl ? (
            <Image src={logoUrl} alt="" width={32} height={32} className="size-8 rounded-sm object-contain" />
          ) : (
            <span aria-hidden className="size-2.5 rotate-45 bg-primary" />
          )}
          <span className="font-serif text-xl font-semibold tracking-wide">{name}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname.startsWith(l.href) ? "page" : undefined}
              className={cn(
                "text-sm text-muted-foreground transition-colors hover:text-foreground",
                pathname.startsWith(l.href) && "text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/booking">Book a Tattoo</Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm">
              <SheetTitle className="px-6 pt-6 font-serif text-2xl">{name}</SheetTitle>
              <SheetDescription className="sr-only">Site navigation</SheetDescription>
              <nav aria-label="Mobile" className="flex flex-col px-6 py-4">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="border-b border-border/60 py-4 text-lg"
                  >
                    {l.label}
                  </Link>
                ))}
                <Button asChild size="lg" className="mt-6">
                  <Link href="/booking" onClick={() => setOpen(false)}>
                    Book a Tattoo
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
