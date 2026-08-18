import { Music, Heart } from "lucide-react"
import { LINKS } from "@/lib/links"

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand/10">
              <Music className="h-4 w-4 text-brand" />
            </div>
            <span className="text-sm font-bold font-[family-name:var(--font-heading)]">Rynote</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-text-muted">
            <a href={LINKS.support} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
              Support
            </a>
            <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
              GitHub
            </a>
            <a href={LINKS.invite} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
              Invite
            </a>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            Made with <Heart className="h-3 w-3 text-danger fill-danger" /> by{" "}
            <a
              href={LINKS.poweredBy}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-primary transition-colors"
            >
              Rynex
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
