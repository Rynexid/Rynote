import { Manager } from '../../../manager.js'
import { TextChannel } from 'discord.js'
import { formatDuration } from '../../../utilities/FormatDuration.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkPlayer } from 'rainlink'
import { getTitle } from '../../../utilities/GetTitle.js'
import { getArtwork } from '../../../utilities/GetArtwork.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['nowplaying']
  public description = 'Display the song currently playing.'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['np']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []

  public options = []

  private buildNPContainer(
    client: Manager,
    handler: CommandHandler,
    player: RainlinkPlayer,
    currentDuration: string,
    part: number,
    totalDuration: string
  ): any {
    const song = player.queue.current
    const Thumbnail = getArtwork(song!)

    const info =
      `### ${getTitle(client, song!, handler.language)}\n` +
      `- **${client.i18n.get(handler.language, 'event.player', 'author_title')}:** ${song!.author}\n` +
      `- **${client.i18n.get(handler.language, 'event.player', 'duration_title')}:** ${formatDuration(song!.duration)}\n` +
      `- **${client.i18n.get(handler.language, 'event.player', 'volume_title')}:** ${player.volume}%\n` +
      `- **${client.i18n.get(handler.language, 'event.player', 'queue_title')}:** ${player.queue.length}\n` +
      `- **${client.i18n.get(handler.language, 'event.player', 'total_duration_title')}:** ${formatDuration(player.queue.duration)}\n` +
      `- **${client.i18n.get(handler.language, 'event.player', 'request_title')}:** ${song!.requester}\n` +
      `- **${client.i18n.get(handler.language, 'command.music', 'np_current_duration', { current_duration: currentDuration, total_duration: totalDuration })}**\n` +
      `\`\`\`🔴 | ${'─'.repeat(part) + '🎶' + '─'.repeat(30 - part)}\`\`\``

    const mediaItems = Thumbnail
      ? [{ type: 12, items: [{ media: { url: Thumbnail }, description: song!.title }] }]
      : []

    return {
      type: 17,
      accent_color: client.color,
      components: [
        ...mediaItems,
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: info },
      ],
    }
  }

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const realtime = client.config.player.NP_REALTIME
    const player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer
    const song = player.queue.current

    if (!song)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'error', 'no_player')}`,
          color: client.color,
        })
      )

    const position = player.position
    const CurrentDuration = formatDuration(position)
    const TotalDuration = formatDuration(song!.duration)
    const Part = Math.floor((position / song!.duration!) * 30)

    const container = this.buildNPContainer(
      client,
      handler,
      player,
      CurrentDuration,
      Part,
      TotalDuration
    )

    const NEmbed = await handler.editReply({ flags: 32768, components: [container] } as any)

    const currentNP = client.nowPlaying.get(`${handler.guild?.id}`)
    if (currentNP) {
      clearInterval(currentNP.interval)
      await currentNP.msg?.delete().catch(() => null)
      client.nowPlaying.delete(`${handler.guild?.id}`)
    }

    if (realtime) {
      const interval: NodeJS.Timeout = setInterval(async () => {
        let currentNPInterval = client.nowPlaying.get(`${handler.guild?.id}`)
        if (!currentNPInterval)
          currentNPInterval = client.nowPlaying
            .set(`${handler.guild?.id}`, {
              interval: interval,
              msg: NEmbed,
            })
            .get(`${handler.guild?.id}`)
        if (!player.queue.current) return clearInterval(interval)
        if (!player.playing) return
        const curDur = formatDuration(player.position)
        const part = Math.floor((player.position / song!.duration!) * 30)
        const updatedContainer = this.buildNPContainer(
          client,
          handler,
          player,
          curDur,
          part,
          TotalDuration
        )

        try {
          const channel = (await client.channels
            .fetch(`${handler.channel?.id}`)
            .catch(() => undefined)) as TextChannel
          if (!channel) return
          const message = await channel.messages
            .fetch(`${currentNPInterval?.msg?.id}`)
            .catch(() => undefined)
          if (!message) return
          if (currentNPInterval && currentNPInterval.msg) {
            const route = `/channels/${channel.id}/messages/${message.id}` as any
            client.rest
              .patch(route, { body: { components: [updatedContainer], flags: 32768 } } as any)
              .catch(() => null)
          }
        } catch (err) {
          return
        }
      }, 5000)
    } else if (!realtime) {
      if (!player.playing) return
      if (NEmbed) {
        const route = `/channels/${handler.channel?.id}/messages/${NEmbed.id}` as any
        client.rest
          .patch(route, { body: { components: [container], flags: 32768 } } as any)
          .catch(() => null)
      }
    }
  }
}
