import {
  Music,
  ListMusic,
  Headphones,
  SlidersHorizontal,
  Radio,
  Repeat,
} from "lucide-react"

const features = [
  {
    icon: Music,
    title: "High Quality Audio",
    description: "Crystal-clear streaming from YouTube, Spotify, SoundCloud, and more sources.",
    gradient: "from-brand/20 to-brand/5",
  },
  {
    icon: ListMusic,
    title: "Playlist Management",
    description: "Create, save, and import playlists from Spotify and YouTube seamlessly.",
    gradient: "from-brand-indigo/20 to-brand-indigo/5",
  },
  {
    icon: SlidersHorizontal,
    title: "Audio Filters",
    description: "Bass boost, nightcore, vaporwave, 8bit — customize your listening experience.",
    gradient: "from-brand-violet/20 to-brand-violet/5",
  },
  {
    icon: Headphones,
    title: "24/7 Playback",
    description: "Rynote stays in your voice channel and plays music around the clock.",
    gradient: "from-success/20 to-success/5",
  },
  {
    icon: Radio,
    title: "AutoPlay",
    description: "Automatically plays related tracks when your queue runs out. Never silence.",
    gradient: "from-info/20 to-info/5",
  },
  {
    icon: Repeat,
    title: "Loop & Shuffle",
    description: "Loop single tracks, entire queues, or shuffle. Full queue control at your fingertips.",
    gradient: "from-warning/20 to-warning/5",
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-32 border-t border-border">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="text-center mb-20">
          <p className="text-sm font-medium text-brand mb-3 tracking-wide uppercase">Features</p>
          <h2 className="text-4xl sm:text-[40px] font-extrabold tracking-[-0.02em] mb-4 font-[family-name:var(--font-heading)]">
            Everything you need
          </h2>
          <p className="text-text-muted text-lg max-w-md mx-auto">
            Powerful features wrapped in a clean, modern interface.
          </p>
        </div>

        {/* Sticky stack cards */}
        <div className="relative">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="sticky top-24"
              style={{ zIndex: i + 1 }}
            >
              <div
                className="rounded-[24px] border border-border bg-surface/95 backdrop-blur-sm p-8 sm:p-10 shadow-[0_10px_30px_rgba(0,0,0,.25)] transition-all duration-300"
                style={{
                  transform: `scale(${1 - (features.length - 1 - i) * 0.02})`,
                  opacity: 1 - (features.length - 1 - i) * 0.08,
                }}
              >
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-14 h-14 rounded-[16px] bg-gradient-to-br ${f.gradient} flex items-center justify-center`}>
                    <f.icon className="h-6 w-6 text-text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 font-[family-name:var(--font-heading)]">
                      {f.title}
                    </h3>
                    <p className="text-text-muted leading-relaxed max-w-lg">
                      {f.description}
                    </p>
                  </div>

                  {/* Visual accent */}
                  <div className="hidden sm:flex flex-shrink-0 w-32 h-20 rounded-[16px] bg-bg-elevated border border-border items-center justify-center overflow-hidden">
                    <div className={`w-full h-full bg-gradient-to-br ${f.gradient} opacity-40`} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
