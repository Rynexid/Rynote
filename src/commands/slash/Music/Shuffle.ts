import { User } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { formatDuration } from '../../../utilities/FormatDuration.js'
import { PageQueue } from '../../../structures/PageQueue.js'
import { getTitle } from '../../../utilities/GetTitle.js'
import { buildV2 } from '../../../utilities/V2.js'
import { ExtendedPlayer } from '../../../structures/extended/ExtendedPlayer.js'

export default class implements Command {
  public name = ['shuffle']
  public description = 'Shuffle the queue in random order'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['sh', 'random']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []

  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(handler.guild!.id) as ExtendedPlayer

    if (player.queue.length == 0)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'error', 'no_song_in_queue')}`,
          color: client.color,
        })
      )

    const newQueue = player.queue.shuffle()

    const song = newQueue.current
    const qduration = `${formatDuration(song!.duration + player.queue.duration)}`

    let pagesNum = Math.ceil(newQueue.length / 10)
    if (pagesNum === 0) pagesNum = 1

    const songStrings = []
    for (let i = 0; i < newQueue.length; i++) {
      const song = newQueue[i]
      songStrings.push(
        `**${i + 1}.** ${getTitle(client, song, handler.language)} \`[${formatDuration(song.duration)}]\``
      )
    }

    const pages: any[][] = []
    for (let i = 0; i < pagesNum; i++) {
      const str = songStrings.slice(i * 10, i * 10 + 10).join('\n')

      pages.push([
        {
          type: 17,
          accent_color: client.color,
          components: [
            {
              type: 10,
              content: `## ${client.i18n.get(handler.language, 'command.music', 'shuffle_msg')}`,
            },
            {
              type: 10,
              content: client.i18n.get(handler.language, 'command.music', 'queue_description', {
                title: getTitle(client, song!, handler.language),
                request: String(song!.requester),
                duration: formatDuration(song!.duration),
                rest:
                  str == ''
                    ? client.i18n.get(handler.language, 'command.music', 'nothing')
                    : '\n' + str,
              }),
            },
          ],
        },
      ])
    }

    client.wsl.get(handler.guild!.id)?.send({
      op: 'playerQueueShuffle',
      guild: handler.guild!.id,
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
      if (handler.message) {
        await new PageQueue(client, pages, 60000, newQueue.length, handler.language).prefixPage(
          handler.message,
          qduration
        )
      } else if (handler.interaction) {
        await new PageQueue(client, pages, 60000, newQueue.length, handler.language).slashPage(
          handler.interaction,
          qduration
        )
      } else return
    } else
      return handler.editReply({
        flags: 32768,
        components: pages[0],
      } as any)
  }
}
