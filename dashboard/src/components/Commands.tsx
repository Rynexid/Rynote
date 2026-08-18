import { CardHover } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { useState } from "react"

const categories = [
  {
    name: "Music",
    color: "#5EA2FF",
    commands: [
      { name: "play", description: "Play a song or playlist from URL or search" },
      { name: "pause", description: "Pause the current song" },
      { name: "resume", description: "Resume paused playback" },
      { name: "stop", description: "Stop playback and clear queue" },
      { name: "skip", description: "Skip to the next song" },
      { name: "skipto", description: "Skip to a specific position in queue" },
      { name: "previous", description: "Play the previous song" },
      { name: "queue", description: "View the current queue" },
      { name: "clearqueue", description: "Clear all songs from the queue" },
      { name: "nowplaying", description: "Show the currently playing song" },
      { name: "lyrics", description: "Get lyrics for a song" },
      { name: "volume", description: "Adjust playback volume" },
      { name: "loop", description: "Toggle loop mode (track/queue)" },
      { name: "shuffle", description: "Shuffle the queue" },
      { name: "unshuffle", description: "Reset queue to original order" },
      { name: "seek", description: "Seek to a position in the song" },
      { name: "forward", description: "Forward by seconds" },
      { name: "rewind", description: "Rewind by seconds" },
      { name: "replay", description: "Restart the current song" },
      { name: "insert", description: "Insert a song at a queue position" },
      { name: "join", description: "Join your voice channel" },
      { name: "autoplay", description: "Toggle autoplay mode" },
      { name: "radio", description: "Play a radio station" },
      { name: "247", description: "Toggle 24/7 mode" },
    ],
  },
  {
    name: "Filter",
    color: "#5B5CFF",
    commands: [
      { name: "filter", description: "Apply or list audio filters" },
      { name: "bassboost", description: "Apply bass boost filter" },
      { name: "superbass", description: "Apply super bass filter" },
      { name: "earrape", description: "Apply earrape filter" },
      { name: "equalizer", description: "Adjust the equalizer bands" },
      { name: "pitch", description: "Adjust playback pitch" },
      { name: "rate", description: "Adjust playback rate" },
      { name: "speed", description: "Adjust playback speed" },
      { name: "television", description: "Apply television filter" },
      { name: "reset", description: "Reset all filters" },
    ],
  },
  {
    name: "Playlist",
    color: "#7867FF",
    commands: [
      { name: "create", description: "Create a new playlist" },
      { name: "delete", description: "Delete a playlist" },
      { name: "add", description: "Add a song to a playlist" },
      { name: "remove", description: "Remove a song from a playlist" },
      { name: "all", description: "List all your playlists" },
      { name: "detail", description: "View playlist details" },
      { name: "info", description: "Get playlist information" },
      { name: "editor", description: "Manage playlist editor" },
      { name: "import", description: "Import from Spotify or YouTube" },
      { name: "savequeue", description: "Save current queue as playlist" },
    ],
  },
  {
    name: "Info",
    color: "#22C55E",
    commands: [
      { name: "help", description: "Show all commands" },
      { name: "ping", description: "Check bot latency" },
      { name: "botinfo", description: "Bot information and stats" },
      { name: "uptime", description: "Show bot uptime" },
      { name: "avatar", description: "Get user avatar" },
      { name: "info", description: "Server information" },
      { name: "invite", description: "Get bot invite link" },
      { name: "support", description: "Get support server link" },
      { name: "tos", description: "Terms of service" },
      { name: "dev", description: "Developer information" },
    ],
  },
  {
    name: "Utils",
    color: "#F59E0B",
    commands: [
      { name: "setup", description: "Setup music channel" },
      { name: "language", description: "Change bot language" },
      { name: "prefix", description: "Change command prefix" },
      { name: "songnoti", description: "Toggle song notifications" },
      { name: "maxlength", description: "Set max song length" },
    ],
  },
  {
    name: "Premium",
    color: "#38BDF8",
    commands: [
      { name: "profile", description: "View your premium profile" },
      { name: "redeem", description: "Redeem a premium code" },
      { name: "generate", description: "Generate a premium code" },
      { name: "userlist", description: "List premium users" },
      { name: "guildlist", description: "List premium guilds" },
      { name: "guildprofile", description: "View guild premium status" },
      { name: "guildremove", description: "Remove guild from premium" },
      { name: "remove", description: "Remove a premium user" },
    ],
  },
  {
    name: "Owner",
    color: "#EF4444",
    commands: [
      { name: "announcement", description: "Send announcement to all servers" },
      { name: "blacklist", description: "Blacklist a user or guild" },
      { name: "host", description: "Manage bot hosting" },
      { name: "shutdown", description: "Shutdown the bot" },
    ],
  },
]

export function Commands() {
  const [active, setActive] = useState(0)
  const totalCommands = categories.reduce((acc, c) => acc + c.commands.length, 0)

  return (
    <section id="commands" className="relative py-32 border-t border-border">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-brand mb-3 tracking-wide uppercase">Commands</p>
          <h2 className="text-4xl sm:text-[40px] font-extrabold tracking-[-0.02em] mb-4 font-[family-name:var(--font-heading)]">
            Powerful by default
          </h2>
          <p className="text-text-muted text-lg max-w-md mx-auto">
            {totalCommands} commands across {categories.length} categories. Everything you need, nothing you don't.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActive(i)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                active === i
                  ? "bg-brand/10 text-brand border border-brand/20"
                  : "text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent"
              }`}
            >
              {cat.name}
              <span className="ml-1.5 text-xs text-text-disabled">({cat.commands.length})</span>
            </button>
          ))}
        </div>

        {/* Command list */}
        <div className="max-w-3xl mx-auto">
          <CardHover className="p-6">
            <div className="space-y-0.5">
              {categories[active].commands.map((cmd) => (
                <div
                  key={cmd.name}
                  className="flex items-center justify-between p-3 rounded-[12px] hover:bg-white/3 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-semibold font-[family-name:var(--font-mono)] text-text-primary group-hover:text-brand transition-colors whitespace-nowrap">
                      /{cmd.name}
                    </span>
                    <span className="text-sm text-text-muted truncate">{cmd.description}</span>
                  </div>
                  <Badge variant="default" className="text-[10px] flex-shrink-0 ml-3">{categories[active].name}</Badge>
                </div>
              ))}
            </div>
          </CardHover>
        </div>
      </div>
    </section>
  )
}
