import {
  ButtonInteraction,
  CacheType,
  InteractionCollector,
  Message,
  MessageFlags,
} from 'discord.js'
import { PlayerButton } from '../@types/Button.js'
import { Manager } from '../manager.js'
import { formatDuration } from '../utilities/FormatDuration.js'
import { RainlinkPlayer } from 'rainlink'
import { getTitle } from '../utilities/GetTitle.js'

export default class implements PlayerButton {
  name = 'queue'
  async run(
    client: Manager,
    message: ButtonInteraction<CacheType>,
    language: string,
    player: RainlinkPlayer,
    nplaying: Message<boolean>,
    collector?: InteractionCollector<ButtonInteraction<'cached'>>
  ): Promise<any> {
    if (!player && collector) {
      collector.stop()
    }
    const song = player.queue.current
    const qduration = `${formatDuration(song!.duration + player.queue.duration)}`
    const thumbnail =
      song?.artworkUrl ?? `https://img.youtube.com/vi/${song!.identifier}/maxresdefault.jpg`

    let pagesNum = Math.ceil(player.queue.length / 10)
    if (pagesNum === 0) pagesNum = 1

    const songStrings = []
    for (let i = 0; i < player.queue.length; i++) {
      const song = player.queue[i]
      songStrings.push(
        `**${i + 1}.** ${getTitle(client, song, language)} \`[${formatDuration(song.duration)}]\``
      )
    }

    const pages: any[][] = []
    for (let i = 0; i < pagesNum; i++) {
      const str = songStrings.slice(i * 10, i * 10 + 10).join('\n')

      const container = {
        type: 17,
        accent_color: client.color,
        components: [
          {
            type: 10,
            content: `## ${client.i18n.get(language, 'button.music', 'queue_author', { guild: message.guild!.name })}`,
          },
          {
            type: 12,
            items: [{ media: { url: thumbnail }, description: 'queue' }],
          },
          { type: 14, divider: true, spacing: 1 },
          {
            type: 10,
            content: client.i18n.get(language, 'button.music', 'queue_description', {
              track: getTitle(client, song!, language),
              duration: formatDuration(song?.duration),
              requester: `${song!.requester}`,
              list_song: str == '' ? client.i18n.get(language, 'command.music', 'nothing') : '\n' + str,
            }),
          },
          {
            type: 10,
            content: `*${client.i18n.get(language, 'button.music', 'queue_footer', {
              page: `${i + 1}`,
              pages: `${pagesNum}`,
              queue_lang: `${player.queue.length}`,
              total_duration: qduration,
            })}*`,
          },
        ],
      }
      pages.push([container])
    }

    message.followUp({
      flags: MessageFlags.IsComponentsV2,
      components: pages[0],
      ephemeral: true,
    } as any)
  }
}
