import { ActivityType } from 'discord.js'
import { Manager } from '../manager.js'

const FALLBACK_NAME = 'Spotify | /play'

export class LiveActivityService {
  private client: Manager
  private interval: NodeJS.Timeout | null = null
  private current: string | null = null

  private readonly REFRESH_MS = 15_000

  constructor(client: Manager) {
    this.client = client
  }

  /** Kick off the periodic refresh loop. Call once from ready. */
  public start(): void {
    if (this.interval) return
    this.refresh()
    this.interval = setInterval(() => this.refresh(), this.REFRESH_MS)
  }

  public stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  /** Applies the presence for whatever is currently playing, if it changed. */
  public refresh(): void {
    const activity = this.buildActivity()
    const key = JSON.stringify(activity)

    if (key === this.current) return
    this.current = key

    try {
      this.client.user?.setPresence({
        activities: [activity],
        status: 'online',
      })
    } catch {
      this.current = null
    }
  }

  private buildActivity() {
    const track = this.findCurrentTrack()
    if (!track) {
      return {
        name: FALLBACK_NAME,
        type: ActivityType.Listening,
      }
    }

    const title = this.clamp(track.title, 120)
    const author = track.author ? this.clamp(track.author, 60) : undefined

    return {
      name: title || FALLBACK_NAME,
      type: ActivityType.Listening,
      state: author,
    }
  }

  /** First player currently with a non-empty queue.current across all guilds. */
  private findCurrentTrack() {
    for (const player of this.client.rainlink.players.values) {
      const current = player.queue?.current
      if (current) return current
    }
    return null
  }

  private clamp(value: string, max: number): string {
    return value.length > max ? `${value.slice(0, max - 1)}…` : value
  }
}
