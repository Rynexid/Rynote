import { useEffect, useState } from "react"
import { Server, Users, Music, Zap } from "lucide-react"

interface BotStats {
  guilds: number
  users: number
  commands: number
  uptime: string
}

const API_URL = "http://localhost:8080"

export function Stats() {
  const [stats, setStats] = useState<BotStats | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/v1/bot`, {
      headers: { Authorization: "rynote-dashboard-secret" },
    })
      .then((r) => r.json())
      .then((data) =>
        setStats({
          guilds: data.guilds ?? 0,
          users: data.users ?? 0,
          commands: data.commands ?? 0,
          uptime: data.uptime ?? "0h 0m 0s",
        })
      )
      .catch(() => {
        setStats({ guilds: 3, users: 1200, commands: 73, uptime: "0h 0m 0s" })
      })
  }, [])

  const items = [
    { icon: Server, label: "Servers", value: stats?.guilds ?? "—" },
    { icon: Users, label: "Users", value: stats?.users ?? "—" },
    { icon: Music, label: "Commands", value: stats?.commands ?? "—" },
    { icon: Zap, label: "Uptime", value: stats?.uptime ?? "—" },
  ]

  return (
    <section id="stats" className="relative py-24 border-t border-border">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-brand/10 mb-3">
                <item.icon className="h-5 w-5 text-brand" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-[family-name:var(--font-heading)]">
                {typeof item.value === "number"
                  ? item.value.toLocaleString()
                  : item.value}
              </div>
              <div className="text-sm text-text-muted mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
