import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/cn"
import { LINKS } from "@/lib/links"
import { Button } from "@/components/ui/Button"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <nav
        className={cn(
          "mx-auto max-w-[1200px] rounded-[16px] transition-all duration-300",
          scrolled
            ? "glass shadow-[0_8px_32px_rgba(0,0,0,.3)]"
            : "bg-surface/60 backdrop-blur-sm border border-border/50"
        )}
      >
        <div className="flex h-14 items-center justify-between px-5">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/RynoteLogo.png" alt="Rynote" className="h-7 w-7 rounded-[8px] object-cover" />
            <span className="text-[15px] font-bold tracking-tight font-[family-name:var(--font-heading)]">
              Rynote
            </span>
          </a>

          <div className="hidden md:flex items-center gap-1">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#commands">Commands</NavLink>
            <NavLink href="#stats">Stats</NavLink>
            <NavLink href={LINKS.support}>Support</NavLink>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="primary" size="sm" asChild>
              <a href={LINKS.invite} target="_blank" rel="noopener noreferrer">
                Add to Server
              </a>
            </Button>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-text-muted hover:text-text-primary transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden mx-auto max-w-[1200px] mt-2 rounded-[16px] glass shadow-[0_8px_32px_rgba(0,0,0,.3)]">
          <div className="px-5 py-4 space-y-1">
            <MobileNavLink href="#features" onClick={() => setMobileOpen(false)}>Features</MobileNavLink>
            <MobileNavLink href="#commands" onClick={() => setMobileOpen(false)}>Commands</MobileNavLink>
            <MobileNavLink href="#stats" onClick={() => setMobileOpen(false)}>Stats</MobileNavLink>
            <MobileNavLink href={LINKS.support} onClick={() => setMobileOpen(false)}>Support</MobileNavLink>
            <div className="pt-2">
              <Button variant="primary" size="md" className="w-full" asChild>
                <a href={LINKS.invite} target="_blank" rel="noopener noreferrer">
                  Add to Server
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith("http")
  return (
    <a
      href={href}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="px-3.5 py-2 text-[13px] font-medium text-text-muted hover:text-text-primary transition-colors rounded-[10px] hover:bg-white/5"
    >
      {children}
    </a>
  )
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  const isExternal = href.startsWith("http")
  return (
    <a
      href={href}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={onClick}
      className="block px-4 py-2.5 text-sm text-text-muted hover:text-text-primary transition-colors rounded-[10px] hover:bg-white/5"
    >
      {children}
    </a>
  )
}
