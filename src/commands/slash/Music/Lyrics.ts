import { ApplicationCommandOptionType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'
import { formatDuration } from '../../../utilities/FormatDuration.js'
import { RainlinkPlayer } from 'rainlink'
import Genius from 'genius-lyrics'

export default class implements Command {
  public name = ['lyrics']
  public description = 'Display lyrics of the song.'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = 'Display lyrics of the song'
  public aliases = ['ly']
  public lavalink = true
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'search',
      description: 'The song name',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(String(handler.guild?.id)) as
      | RainlinkPlayer
      | undefined
    const track = player?.queue.current

    if (player && track) {
      const lavalinkLyrics = await this.fetchLavalinkLyrics(
        client,
        player,
        String(handler.guild?.id),
        handler.language
      )
      if (lavalinkLyrics) {
        const { text, title, synced } = lavalinkLyrics
        return handler.replyV2([
          this.buildLyricsContainer(client, handler, track, player, title, text, synced),
        ])
      }
    }

    const token = client.config.player.GENIUS_TOKEN
    if (!token) {
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'lyrics_notfound')}`,
          color: client.color,
        })
      )
    }

    const genius = new Genius.Client(token)

    let query = handler.args.join(' ').trim()
    const candidates: string[] = []
    if (!query && track) {
      const cleanTitle = track.title
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/\b(official|music|video|audio|lyrics|hd|4k)\b/gi, '')
        .replace(/\b\d+x\b/gi, '')
        .replace(/[\s\-–—]+$/g, '')
        .trim()
      const author = track.author ?? ''
      candidates.push(cleanTitle)
      if (author && !cleanTitle.toLowerCase().includes(author.toLowerCase())) {
        candidates.push(`${cleanTitle} ${author}`.trim())
      }
      query = candidates[0]
    }

    if (!query) {
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'lyrics_notfound')}`,
          color: client.color,
        })
      )
    }

    try {
      let results: any[] = []
      for (const q of [query, ...candidates.slice(1)]) {
        const qT = q.trim()
        if (!qT) continue
        const r = await genius.songs.search(qT)
        if (r.length) {
          results = r
          break
        }
      }
      if (!results.length) {
        return handler.replyV2(
          buildV2({
            description: `${client.i18n.get(handler.language, 'command.music', 'lyrics_notfound')}`,
            color: client.color,
          })
        )
      }

      const song = results[0]
      const lyrics = await song.lyrics()
      if (!lyrics) {
        return handler.replyV2(
          buildV2({
            description: `${client.i18n.get(handler.language, 'command.music', 'lyrics_notfound')}`,
            color: client.color,
          })
        )
      }

      let description = lyrics
      if (lyrics.length > 3900) {
        description = lyrics.slice(0, 3897) + '...'
      }

      return handler.replyV2([
        this.buildLyricsContainer(client, handler, track, player, song.title, description, false),
      ])
    } catch (err) {
      client.logger.error('Lyrics', err)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'lyrics_notfound')}`,
          color: client.color,
        })
      )
    }
  }

  private buildLyricsContainer(
    client: Manager,
    handler: CommandHandler,
    track: any,
    player: RainlinkPlayer | undefined,
    title: string,
    lyricsText: string,
    synced: boolean
  ) {
    const artworkUrl =
      track.artworkUrl ?? `https://img.youtube.com/vi/${track.identifier}/maxresdefault.jpg`

    const unknown = client.i18n.get(handler.language, 'command.music', 'unknown')
    const source = track.source ?? track.info?.sourceName ?? unknown
    const sourceName = this.formatSourceName(source)
    const sourceUrl = track.uri ?? `https://www.youtube.com/watch?v=${track.identifier}`

    const isLive = track.info?.isStream || (track.duration && track.duration > 3600000000)
    const duration = isLive
      ? client.i18n.get(handler.language, 'command.music', 'live')
      : formatDuration(track.duration)
    const requester = track.requester
      ? typeof track.requester === 'string'
        ? track.requester
        : (track.requester.username ?? track.requester.globalName ?? unknown)
      : unknown

    const progressBar = this.buildProgressBar(player)

    const metadata =
      `🔗 | **${client.i18n.get(handler.language, 'command.music', 'lyrics_source')}:** [${sourceName}](${sourceUrl})\n` +
      `✒️ | **${client.i18n.get(handler.language, 'command.music', 'lyrics_author')}:** ${track.author ?? unknown}\n` +
      `🕒 | **${client.i18n.get(handler.language, 'command.music', 'lyrics_duration')}:** ${duration}\n` +
      `👤 | **${client.i18n.get(handler.language, 'command.music', 'lyrics_requester')}:** ${requester}`

    let lyrics = lyricsText
    if (lyrics.length > 3900) lyrics = lyrics.slice(0, 3897) + '...'

    const syncedLabel = synced
      ? `${client.i18n.get(handler.language, 'command.music', 'synced_lyrics')}\n\n`
      : ''

    const content = `${syncedLabel}${lyrics}`

    const components: any[] = [
      {
        type: 12,
        items: [{ media: { url: artworkUrl, size: 4 }, description: title }],
      },
      { type: 14, divider: true, spacing: 1 },
      {
        type: 10,
        content: `## ${title}`,
      },
      { type: 14, divider: true, spacing: 1 },
      {
        type: 10,
        content: metadata,
      },
      { type: 14, divider: true, spacing: 1 },
      {
        type: 10,
        content: content,
      },
    ]

    if (progressBar) {
      components.push({ type: 14, divider: true, spacing: 1 })
      components.push({ type: 10, content: progressBar })
    }

    return {
      type: 17,
      accent_color: client.color,
      components,
    }
  }

  private buildProgressBar(player: RainlinkPlayer | undefined): string | null {
    if (!player || !player.playing || !player.queue.current) return null
    const position = player.position
    const duration = player.queue.current.duration
    if (!duration || duration > 3600000000) return null
    const part = Math.floor((position / duration) * 30)
    return `\`\`\`🔴 | ${'─'.repeat(part) + '🎶' + '─'.repeat(30 - part)}\`\`\``
  }

  private formatSourceName(source: string): string {
    switch (source.toLowerCase()) {
      case 'spotify':
        return 'Spotify'
      case 'youtube':
        return 'YouTube'
      case 'deezer':
        return 'Deezer'
      case 'applemusic':
        return 'Apple Music'
      case 'soundcloud':
        return 'SoundCloud'
      case 'lavasrc':
        return 'LavaSrc'
      default:
        return source.charAt(0).toUpperCase() + source.slice(1)
    }
  }

  private async fetchLavalinkLyrics(
    client: Manager,
    player: any,
    guildId: string,
    language: string
  ) {
    try {
      const node = player.node
      const driver = node.driver as any
      const sessionId = driver?.sessionId
      if (!sessionId) return null

      const { host, port, auth, secure } = node.options
      const url = `${secure ? 'https' : 'http'}://${host}:${port}/v4/sessions/${sessionId}/players/${guildId}/track/lyrics?skipTrackSource=true`

      const fetchLyrics = () =>
        fetch(url, {
          headers: { Authorization: auth },
          signal: AbortSignal.timeout(15000),
        })

      let res = await fetchLyrics()
      if (!res.ok || res.status === 204) {
        await new Promise((r) => setTimeout(r, 1000))
        res = await fetchLyrics()
      }
      if (!res.ok || res.status === 204) return null

      const data = await res.json()

      const topText = typeof data?.text === 'string' ? data.text.trim() : ''
      const lines = Array.isArray(data?.lines) ? data.lines : []

      const syncedLines = lines
        .map((l: any) => ({
          t: typeof l?.timestamp === 'number' ? l.timestamp : 0,
          line: l?.line ?? l?.text ?? '',
        }))
        .filter((l: any) => l.line)

      const hasTime = syncedLines.some((l: any) => l.t > 0)
      const syncedText = syncedLines
        .map((l: any) => (hasTime ? `[${this.formatTime(l.t)}] ${l.line}` : l.line))
        .join('\n')
        .trim()

      const text = syncedText || topText
      if (!text) return null

      const title = data?.name ?? data?.title ?? player.queue.current?.title ?? client.i18n.get(language, 'command.music', 'unknown')
      return { text, title: String(title), synced: hasTime && syncedLines.length > 0 }
    } catch (err) {
      client.logger.error('Lyrics', err)
      return null
    }
  }

  private formatTime(ms: number) {
    const totalSec = Math.floor(ms / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }
}
