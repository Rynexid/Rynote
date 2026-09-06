import { ApplicationCommandOptionType } from 'discord.js'
import { formatDuration } from '../../../utilities/FormatDuration.js'
import { PageQueue } from '../../../structures/PageQueue.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkPlayer, RainlinkTrack } from 'rainlink'
import { getTitle } from '../../../utilities/GetTitle.js'
import { getArtwork } from '../../../utilities/GetArtwork.js'

// Main code
export default class implements Command {
  public name = ['queue']
  public description = 'Show the queue of songs.'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = '<page_number>'
  public aliases = ['q']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []
  public options = [
    {
      name: 'page',
      description: 'Page number to show.',
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const value = handler.args[0]

    if (value && isNaN(+value))
      return handler.editReply({
        flags: 32768,
        components: [
          {
            type: 17,
            accent_color: client.color,
            components: [
              {
                type: 10,
                content: `${client.i18n.get(handler.language, 'error', 'number_invalid')}`,
              },
            ],
          },
        ],
      } as any)

    const player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer

    const song = player.queue.current

    if (!song)
      return handler.editReply({
        flags: 32768,
        components: [
          {
            type: 17,
            accent_color: client.color,
            components: [
              {
                type: 10,
                content: `${client.i18n.get(handler.language, 'error', 'no_player')}`,
              },
            ],
          },
        ],
      } as any)

    const qduration = `${formatDuration(song.duration + player.queue.duration)}`

    let pagesNum = Math.ceil(player.queue.length / 10)
    if (pagesNum === 0) pagesNum = 1

    const songStrings = []
    for (let i = 0; i < player.queue.length; i++) {
      const song = player.queue[i]
      songStrings.push(
        `**${i + 1}.** ${getTitle(client, song, handler.language)} \`[${formatDuration(song.duration)}]\``
      )
    }

    const npTitle = getTitle(client, song!, handler.language)
    const npThumb = await getArtwork(song!)
    const pos = formatDuration(player.position)
    const tot = formatDuration(song!.duration)

    const mediaItems = npThumb
      ? [
          {
            type: 12,
            items: [
              {
                media: { url: npThumb },
                description: client.i18n.get(handler.language, 'command.music', 'np_title'),
              },
            ],
          },
        ]
      : []

    const pages: any[][] = []
    for (let i = 0; i < pagesNum; i++) {
      const str = songStrings.slice(i * 10, i * 10 + 10).join('\n')
      const accentColor = client.color

      pages.push([
        {
          type: 17,
          accent_color: accentColor,
          components: [
            ...mediaItems,
            {
              type: 10,
              content: `## ${client.i18n.get(handler.language, 'command.music', 'queue_author', {
                guild: handler.guild!.name,
              })}`,
            },
            {
              type: 10,
              content: client.i18n.get(handler.language, 'command.music', 'queue_np', {
                title: npTitle,
                total: tot,
                current: pos,
                author: song!.author,
                request: String(song!.requester),
              }),
            },
            { type: 14, divider: true, spacing: 1 },
            {
              type: 10,
              content: `💤 ${client.i18n.get(handler.language, 'command.music', 'queue_rest', {
                rest: str == '' ? client.i18n.get(handler.language, 'command.music', 'nothing') : '\n' + str,
              })}`,
            },
          ],
        },
      ])
    }

    if (!value) {
      if (pages.length == pagesNum && player.queue.length > 10) {
        if (handler.message) {
          await new PageQueue(
            client,
            pages,
            60000,
            player.queue.length,
            handler.language
          ).prefixPage(handler.message, qduration)
        } else if (handler.interaction) {
          await new PageQueue(
            client,
            pages,
            60000,
            player.queue.length,
            handler.language
          ).slashPage(handler.interaction, qduration)
        } else return
      } else
        return handler.editReply({
          flags: 32768,
          components: pages[0],
        } as any)
    } else {
      if (isNaN(+value))
        return handler.editReply({
          flags: 32768,
          components: [
            {
              type: 17,
              accent_color: client.color,
              components: [
                {
                  type: 10,
                  content: `${client.i18n.get(handler.language, 'command.music', 'queue_notnumber')}`,
                },
              ],
            },
          ],
        } as any)
      if (Number(value) > pagesNum)
        return handler.editReply({
          flags: 32768,
          components: [
            {
              type: 17,
              accent_color: client.color,
              components: [
                {
                  type: 10,
                  content: `${client.i18n.get(
                    handler.language,
                    'command.music',
                    'queue_page_notfound',
                    {
                      page: String(pagesNum),
                    }
                  )}`,
                },
              ],
            },
          ],
        } as any)
      const pageNum = Number(value) == 0 ? 1 : Number(value) - 1
      return handler.editReply({
        flags: 32768,
        components: pages[pageNum],
      } as any)
    }
  }
}
