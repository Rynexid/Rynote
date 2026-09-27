import { Manager } from '../manager.js'
import { TextChannel } from 'discord.js'
import { formatDuration } from '../utilities/FormatDuration.js'
import { RainlinkPlayer } from 'rainlink'
import { getTitle } from '../utilities/GetTitle.js'
import { getSourceName } from '../utilities/SourceName.js'
import { RYNOTE_BANNER_URL } from '../utilities/Links.js'
import { setupPlayerButtons } from '../utilities/SetupPlayerButtons.js'

export class ChannelUpdater {
  client: Manager
  constructor(client: Manager) {
    this.client = client
    this.loader(this.client)
  }

  async loader(client: Manager) {
    client.UpdateQueueMsg = async function (player: RainlinkPlayer) {
      let data = await client.db.setup.get(`${player.guildId}`)
      if (!data) return
      if (data.enable === false) return

      let channel = (await client.channels
        .fetch(data.channel)
        .catch(() => undefined)) as TextChannel
      if (!channel) return

      let playMsg = await channel.messages.fetch(data.playmsg).catch(() => undefined)
      if (!playMsg) return

      let guildModel = await client.db.language.get(`${player.guildId}`)
      if (!guildModel) {
        guildModel = await client.db.language.set(`${player.guildId}`, client.config.bot.LANGUAGE)
      }

      const language = guildModel

      const queuedSongs = player.queue.map(
        (song, i) =>
          `${client.i18n.get(language, 'event.setup', 'setup_content_queue', {
            index: `${i + 1}`,
            title: song.title,
            duration: formatDuration(song.duration),
            request: `${song.requester}`,
          })}`
      )

      const Str = queuedSongs.slice(0, 10).join('\n')

      const TotalDuration = player.queue.duration

      let cSong = player.queue.current
      let qDuration = `${formatDuration(TotalDuration + Number(player.queue.current?.duration))}`

      const mediaItems = [
        {
          type: 12,
          items: [
            {
              media: { url: cSong!.artworkUrl ? cSong!.artworkUrl : RYNOTE_BANNER_URL },
              description: getTitle(client, cSong!, language),
            },
          ],
        },
      ]

      const unknown = client.i18n.get(language, 'command.music', 'unknown')

      const duration = cSong!.duration ?? 0
      const clamped = Math.max(0, Math.min(1, duration ? player.position / duration : 0))
      const part = Math.round(clamped * 20)
      const bar = `▰`.repeat(part) + `▱`.repeat(20 - part)

      const progress = client.i18n.get(language, 'event.setup', 'setup_progress', {
        bar,
        current: formatDuration(player.position),
        total: formatDuration(duration),
      })

      const metadata =
        `${progress}\n` +
        `${client.i18n.get(language, 'event.setup', 'setup_meta_author', {
          author: cSong!.author ?? unknown,
        })}\n` +
        `${client.i18n.get(language, 'event.setup', 'setup_meta_duration', {
          duration: formatDuration(duration),
        })}\n` +
        `${client.i18n.get(language, 'event.setup', 'setup_meta_volume', {
          volume: `${player.volume}`,
        })}\n` +
        `${client.i18n.get(language, 'event.setup', 'setup_meta_queue_count', {
          count: `${player.queue.length}`,
        })}\n` +
        `${client.i18n.get(language, 'event.setup', 'setup_meta_queue_duration', {
          duration: qDuration,
        })}\n` +
        `${client.i18n.get(language, 'event.setup', 'setup_meta_source', {
          source: getSourceName(client, cSong!, language),
        })}`

      const queueBody = `${client.i18n.get(language, 'event.setup', 'setup_content')}${
        Str == ''
          ? `${client.i18n.get(language, 'event.setup', 'setup_content_empty')}`
          : '\n' + Str
      }`

      await playMsg
        .edit({
          flags: 32768,
          content: ' ',
          components: [
            {
              type: 17,
              accent_color: client.color,
              components: [
                ...mediaItems,
                {
                  type: 10,
                  content: `## ${client.i18n.get(
                    language,
                    'event.setup',
                    player.paused ? 'setup_author_paused' : 'setup_author'
                  )}`,
                },
                {
                  type: 10,
                  content: client.i18n.get(language, 'event.setup', 'setup_desc', {
                    title: getTitle(client, cSong!, language),
                  }),
                },
                { type: 10, content: metadata },
                { type: 14, divider: true, spacing: 1 },
                { type: 10, content: `💤 ${queueBody}` },
                ...setupPlayerButtons(client),
              ],
            },
          ],
        })
        .catch(() => {})

      if (!client.interval.get(player.guildId)) {
        const timer = setInterval(async () => {
          const p = client.rainlink.players.get(player.guildId)
          if (!p || !p.queue.current) {
            clearInterval(timer)
            client.interval.delete(player.guildId)
            return
          }
          await client.UpdateQueueMsg(p).catch(() => {})
        }, 5000)
        client.interval.set(player.guildId, timer)
      }
    }

    /**
     *
     * @param {Player} player
     */
    client.UpdateMusic = async function (player: RainlinkPlayer) {
      const stale = client.interval.get(player.guildId)
      if (stale) {
        clearInterval(stale as unknown as NodeJS.Timeout)
        client.interval.delete(player.guildId)
      }

      let data = await client.db.setup.get(`${player.guildId}`)
      if (!data) return
      if (data.enable === false) return

      let channel = (await client.channels
        .fetch(data.channel)
        .catch(() => undefined)) as TextChannel
      if (!channel) return

      let playMsg = await channel.messages.fetch(data.playmsg).catch(() => undefined)
      if (!playMsg) return

      let guildModel = await client.db.language.get(`${player.guildId}`)
      if (!guildModel) {
        guildModel = await client.db.language.set(`${player.guildId}`, client.config.bot.LANGUAGE)
      }

      const language = guildModel

      const queueMsg = `${client.i18n.get(language, 'event.setup', 'setup_queuemsg')}`

      return await playMsg
        .edit({
          flags: 32768,
          content: ' ',
          components: [
            {
              type: 17,
              accent_color: client.color,
              components: [
                {
                  type: 12,
                  items: [
                    {
                      media: { url: RYNOTE_BANNER_URL },
                      description: client.i18n.get(
                        language,
                        'event.setup',
                        'setup_playembed_author'
                      ),
                    },
                  ],
                },
                {
                  type: 10,
                  content: `## ${client.i18n.get(language, 'event.setup', 'setup_playembed_author')}`,
                },
                { type: 10, content: queueMsg },
                ...setupPlayerButtons(client),
              ],
            },
          ],
        })
        .catch(() => {})
    }
  }
}
