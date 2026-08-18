import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/cn"

const faqs = [
  {
    q: "Is Rynote free to use?",
    a: "Yes. Rynote is completely free with no premium paywall for core features. All music commands, filters, and playlist management are available to everyone.",
  },
  {
    q: "What music sources are supported?",
    a: "YouTube, Spotify, SoundCloud, Twitch, Deezer, and HTTP audio streams. We're always adding more.",
  },
  {
    q: "Does Rynote support audio filters?",
    a: "Yes. Bass boost, nightcore, vaporwave, 8bit, and more. Adjustable in real-time through commands or the dashboard.",
  },
  {
    q: "What is 24/7 mode?",
    a: "24/7 mode keeps Rynote in your voice channel permanently, playing music or staying idle until someone requests a song.",
  },
  {
    q: "Can I import playlists from Spotify?",
    a: "Yes. Use /playlist import with a Spotify playlist URL. Rynote will find and queue matching tracks from YouTube.",
  },
  {
    q: "How do I set up the dashboard?",
    a: "Add Rynote to your server, visit the dashboard URL, and log in with Discord. No additional setup required.",
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="relative py-32 border-t border-border">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-brand mb-3 tracking-wide uppercase">FAQ</p>
          <h2 className="text-4xl sm:text-[40px] font-extrabold tracking-[-0.02em] mb-4 font-[family-name:var(--font-heading)]">
            Frequently asked questions
          </h2>
        </div>

        <div className="max-w-2xl mx-auto space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-[16px] border border-border bg-surface overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex items-center justify-between w-full px-6 py-4 text-left"
              >
                <span className="text-sm font-medium text-text-primary">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-text-muted transition-transform duration-200 flex-shrink-0 ml-4",
                    open === i && "rotate-180"
                  )}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-4 text-sm text-text-muted leading-relaxed animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
