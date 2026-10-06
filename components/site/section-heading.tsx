import { cn } from "@/lib/utils"

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: "left" | "center"
  className?: string
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 font-serif text-4xl font-semibold text-balance sm:text-5xl">{title}</h2>
      {description && <p className="mt-4 leading-relaxed text-pretty text-muted-foreground">{description}</p>}
    </div>
  )
}

export function PageHero({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,oklch(0.58_0.22_25/0.14),transparent)]"
      />
      <div className="container-page relative py-16 sm:py-24">
        {eyebrow && <p className="eyebrow animate-fade-up">{eyebrow}</p>}
        <h1 className="animate-fade-up mt-3 max-w-3xl font-serif text-5xl font-semibold text-balance sm:text-7xl">{title}</h1>
        {description && (
          <p className="animate-fade-up mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </section>
  )
}
