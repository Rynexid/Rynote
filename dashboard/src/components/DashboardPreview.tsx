import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import {
  Music,
  ListMusic,
  BarChart3,
  Settings,
  Heart,
  Clock,
  Play,
  Pause,
  SkipForward,
  Volume2,
  Home,
  Search,
  Library,
  Headphones,
} from "lucide-react"

export function DashboardPreview() {
  return (
    <section className="relative py-32 border-t border-border">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-brand mb-3 tracking-wide uppercase">Dashboard</p>
          <h2 className="text-4xl sm:text-[40px] font-extrabold tracking-[-0.02em] mb-4 font-[family-name:var(--font-heading)]">
            Control everything
          </h2>
          <p className="text-text-muted text-lg max-w-md mx-auto">
            A beautiful web dashboard to manage your music experience.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,.25)]">
            <div className="grid grid-cols-[240px_1fr] min-h-[480px]">
              {/* Sidebar */}
              <div className="border-r border-border p-4 space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 mb-4">
                  <Headphones className="h-4 w-4 text-brand" />
                  <span className="text-sm font-semibold">Dashboard</span>
                </div>
                {[
                  { icon: Home, label: "Overview", active: true },
                  { icon: Music, label: "Player" },
                  { icon: ListMusic, label: "Queue" },
                  { icon: Library, label: "Playlists" },
                  { icon: Heart, label: "Favorites" },
                  { icon: Clock, label: "History" },
                  { icon: BarChart3, label: "Statistics" },
                  { icon: Settings, label: "Settings" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm transition-colors ${
                      item.active
                        ? "bg-brand/10 text-brand"
                        : "text-text-muted hover:text-text-primary hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold font-[family-name:var(--font-heading)]">Now Playing</h3>
                    <p className="text-sm text-text-muted">Soraku • 3 members listening</p>
                  </div>
                  <Badge variant="success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Connected
                  </Badge>
                </div>

                {/* Player mockup */}
                <div className="grid grid-cols-[160px_1fr] gap-6 mb-6">
                  <div className="rounded-[16px] bg-brand/5 border border-border p-2">
                    <img
                      src="/RynoteLogo.png"
                      alt="Now Playing"
                      className="w-full h-auto rounded-[12px]"
                    />
                  </div>
                  <div className="flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-semibold mb-1">Midnight City</h4>
                      <p className="text-sm text-text-muted">M83 • Hurry Up, We're Dreaming</p>
                      <p className="text-xs text-text-disabled mt-1">YouTube • 4:03</p>
                    </div>
                    <div>
                      <div className="h-1 rounded-full bg-bg-elevated overflow-hidden mb-2">
                        <div className="h-full w-[45%] rounded-full gradient-brand" />
                      </div>
                      <div className="flex items-center justify-center gap-5">
                        <button className="text-text-muted hover:text-text-primary"><SkipForward className="h-4 w-4 rotate-180" /></button>
                        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-hover transition-colors"><Pause className="h-4 w-4" /></button>
                        <button className="text-text-muted hover:text-text-primary"><SkipForward className="h-4 w-4" /></button>
                        <button className="text-text-muted hover:text-text-primary"><Volume2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Queue", value: "8" },
                    { label: "Volume", value: "80%" },
                    { label: "Loop", value: "Off" },
                    { label: "Autoplay", value: "On" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-[12px] bg-bg-elevated border border-border p-3 text-center">
                      <p className="text-xs text-text-muted mb-1">{s.label}</p>
                      <p className="text-sm font-semibold">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
