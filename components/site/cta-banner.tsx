import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CtaBanner({
  title = "Ready to start your piece?",
  description = "Tell us about your idea. We will review your request, confirm a time and guide you through every step.",
}: {
  title?: string
  description?: string
}) {
  return (
    <section className="container-page py-16 sm:py-24">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card px-6 py-14 text-center sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_100%,oklch(0.58_0.22_25/0.25),transparent)]"
        />
        <div className="relative">
          <p className="eyebrow">Book your session</p>
          <h2 className="mx-auto mt-3 max-w-2xl font-serif text-4xl font-semibold text-balance sm:text-6xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">{description}</p>
          <Button asChild size="lg" className="mt-8 h-12 px-8 text-base">
            <Link href="/booking">Book a Tattoo</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
