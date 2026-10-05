import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { formatDuration } from '../../../utilities/FormatDuration.js'
import { getTitle } from '../../../utilities/GetTitle.js'
import { getArtwork } from '../../../utilities/GetArtwork.js'
import { PageQueue } from '../../../structures/PageQueue.js'
import { RainlinkPlayer } from 'rainlink'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['queue']
  public description = 'Show the songs in the queue'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = '[page]'
  public aliases = ['q', 'que', 'playlist']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []

  public options = [
    {
      name: 'page',
      description: 'The page you want to view',
      type: ApplicationCommandOptionType.Integer,
      required: false,
      min_value: 1,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer
    const song = player.queue.current

    if (!song)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'error', 'no_player')}`,
          color: client.color,
        })
      )

    const arg = handler.interaction
      ? (handler.interaction as ChatInputCommandInteraction).options.getInteger('page')
      : handler.args[0]

    if (arg && isNaN(+arg))
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'queue_notnumber')}`,
          color: client.color,
        })
      )

    const pageNum = Number(arg || 1)
    const pageIndex = Number.isNaN(pageNum) ? 1 : Math.max(1, pageNum)
    const qduration = `${formatDuration(song.duration + player.queue.duration)}`

    let pagesNum = Math.ceil(player.queue.length / 10)
    if (pagesNum === 0) pagesNum = 1

    if (pageIndex < 1 || pageIndex > pagesNum)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(
            handler.language,
            'command.music',
            'queue_page_notfound',
            { page: String(pagesNum) }
          )}`,
          color: client.color,
        })
      )

    const songStrings = []
    for (let i = 0; i < player.queue.length; i++) {
      const queued = player.queue[i]
      songStrings.push(
        `**${i + 1}.** ${getTitle(client, queued, handler.language)} \`[${formatDuration(queued.duration)}]\``
      )
    }

    const thumbnail = await getArtwork(song)

    const pages: any[][] = []
    for (let i = 0; i < pagesNum; i++) {
      const str = songStrings.slice(i * 10, i * 10 + 10).join('\n')

      const mediaItems = thumbnail
        ? [{ type: 12, items: [{ media: { url: thumbnail }, description: song.title }] }]
        : []

      pages.push([
        {
          type: 17,
          accent_color: client.color,
          components: [
            {
              type: 10,
              content: `## ${client.i18n.get(handler.language, 'command.music', 'queue_author', {
                guild: handler.guild!.name,
              })}`,
            },
            ...mediaItems,
            { type: 14, divider: true, spacing: 1 },
            {
              type: 10,
              content: client.i18n.get(handler.language, 'command.music', 'queue_description', {
                title: getTitle(client, song, handler.language),
                request: String(song.requester),
                duration: formatDuration(song.duration),
                rest:
                  str == ''
                    ? client.i18n.get(handler.language, 'command.music', 'nothing')
                    : '\n' + str,
              }),
            },
            {
              type: 10,
              content: `*${client.i18n.get(handler.language, 'command.music', 'queue_footer', {
                page: `${i + 1}`,
                pages: `${pagesNum}`,
                queue_lang: `${player.queue.length}`,
                duration: qduration,
              })}*`,
            },
          ],
        },
      ])
    }

    if (pagesNum > 1) {
      if (handler.message) {
        await new PageQueue(client, pages, 60000, player.queue.length, handler.language).prefixPage(
          handler.message,
          qduration
        )
      } else if (handler.interaction) {
        await new PageQueue(client, pages, 60000, player.queue.length, handler.language).slashPage(
          handler.interaction,
          qduration
        )
      } else return
    } else {
      return handler.editReply({
        flags: 32768,
        components: pages[pageIndex - 1],
      } as any)
    }
  }
}
