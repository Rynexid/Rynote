import { CardHover } from "@/components/ui/Card"
import { Play, Music, Radio, Globe, Headphones, Disc3 } from "lucide-react"

const platforms = [
  { icon: Play, name: "YouTube", color: "#FF0000" },
  { icon: Music, name: "Spotify", color: "#1DB954" },
  { icon: Radio, name: "SoundCloud", color: "#FF5500" },
  { icon: Globe, name: "HTTP Streams", color: "#5EA2FF" },
  { icon: Headphones, name: "Twitch", color: "#9146FF" },
  { icon: Disc3, name: "Deezer", color: "#A238FF" },
]

export function Platforms() {
  return (
    <section className="relative py-32 border-t border-border">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-brand mb-3 tracking-wide uppercase">Sources</p>
          <h2 className="text-4xl sm:text-[40px] font-extrabold tracking-[-0.02em] mb-4 font-[family-name:var(--font-heading)]">
            Play from anywhere
          </h2>
          <p className="text-text-muted text-lg max-w-md mx-auto">
            Support for all major music platforms and streaming services.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-3xl mx-auto">
          {platforms.map((p) => (
            <CardHover key={p.name} className="p-5 flex flex-col items-center gap-3">
              <div
                className="w-10 h-10 rounded-[12px] flex items-center justify-center"
                style={{ backgroundColor: `${p.color}15` }}
              >
                <p.icon className="h-5 w-5" style={{ color: p.color }} />
              </div>
              <span className="text-xs font-medium text-text-secondary">{p.name}</span>
            </CardHover>
          ))}
        </div>
      </div>
    </section>
  )
}
