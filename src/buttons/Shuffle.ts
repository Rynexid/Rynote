import {
  ButtonInteraction,
  CacheType,
  InteractionCollector,
  Message,
  MessageFlags,
  User,
} from 'discord.js'
import { PlayerButton } from '../@types/Button.js'
import { Manager } from '../manager.js'
import { formatDuration } from '../utilities/FormatDuration.js'
import { PageQueue } from '../structures/PageQueue.js'
import { RainlinkPlayer } from 'rainlink'
import { getTitle } from '../utilities/GetTitle.js'

export default class implements PlayerButton {
  name = 'shuffle'
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

    const newQueue = player.queue.shuffle()

    const song = newQueue.current
    const qduration = `${formatDuration(song!.duration + player.queue.duration)}`
    const thumbnail =
      song?.artworkUrl ?? `https://img.youtube.com/vi/${song!.identifier}/maxresdefault.jpg`

    let pagesNum = Math.ceil(newQueue.length / 10)
    if (pagesNum === 0) pagesNum = 1

    const songStrings = []
    for (let i = 0; i < newQueue.length; i++) {
      const song = newQueue[i]
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
          { type: 10, content: `## ${client.i18n.get(language, 'button.music', 'shuffle_msg')}` },
          {
            type: 12,
            items: [{ media: { url: thumbnail }, description: 'shuffle' }],
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
              queue_lang: `${newQueue.length}`,
              total_duration: qduration,
            })}*`,
          },
        ],
      }
      pages.push([container])
    }

    client.wsl.get(message.guild!.id)?.send({
      op: 'playerQueueShuffle',
      guild: message.guild!.id,
      queue: player.queue.map((track) => {
        const requesterQueue = track.requester as User
        return {
          title: track.title,
          uri: track.uri,
          length: track.duration,
          thumbnail: track.artworkUrl,
          author: track.author,
          requester: requesterQueue
            ? {
                id: requesterQueue.id,
                username: requesterQueue.username,
                globalName: requesterQueue.globalName,
                defaultAvatarURL: requesterQueue.defaultAvatarURL ?? null,
              }
            : null,
        }
      }),
    })

    if (pages.length == pagesNum && newQueue.length > 10) {
      await new PageQueue(client, pages, 60000, newQueue.length, language).buttonPage(
        message,
        qduration
      )
    } else {
      message.followUp({
        flags: MessageFlags.IsComponentsV2,
        components: pages[0],
        ephemeral: true,
      } as any)
    }
  }
}
