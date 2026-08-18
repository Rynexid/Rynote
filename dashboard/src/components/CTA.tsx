import { ArrowRight, MessageCircle } from "lucide-react"
import { LINKS } from "@/lib/links"
import { Button } from "@/components/ui/Button"

export function CTA() {
  return (
    <section className="relative py-32 border-t border-border">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-brand/6 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] mb-4 font-[family-name:var(--font-heading)]">
          Ready to level up your server?
        </h2>
        <p className="text-text-muted text-lg mb-10">
          Add Rynote to your Discord server in one click. Free forever.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" asChild>
            <a href={LINKS.invite} target="_blank" rel="noopener noreferrer">
              <ArrowRight className="h-4 w-4" />
              Add to Server — Free
            </a>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <a href={LINKS.support} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Join Support Server
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
