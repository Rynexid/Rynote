import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'
import {
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  Message,
} from 'discord.js'
import { buildV2 } from '../../../utilities/V2.js'
import { EMOJI } from '../../../utilities/Emoji.js'

const PAGE_SIZE = 12
const SP_PREV = 'sp_prev'
const SP_NEXT = 'sp_next'
const SP_SHUFFLE = 'sp_shuffle'

type OpenverseImage = {
  url: string
  title?: string
  creator?: string
  license?: string
  provider?: string
}

export default class implements Command {
  public name = ['searchphoto']
  public description = 'Search for a photo from the web by keyword'
  public category = 'Info'
  public accessableby = [Accessableby.Member]
  public usage = '<keyword>'
  public aliases = ['img', 'sp']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'query',
      description: 'Keyword to search photos for (e.g. cat, mountain, neon city)',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.image', key, args)

    const query = (handler.interaction ? handler.args[0] : handler.args.join(' ')).trim()

    if (!query)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          color: client.color,
          description: `${client.i18n.get(handler.language, 'error', 'no_query', {
            example: `${handler.prefix}${this.name[0]} cat`,
          })}`,
        }),
      } as any)

    const authorId = handler.interaction?.user.id ?? handler.message?.author.id

    let results: OpenverseImage[] = []
    let index = 0
    let pageCount = 1

    const fetchPage = async (page: number): Promise<string | null> => {
      try {
        const res = await fetch(
          `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=${PAGE_SIZE}&page=${page}`,
          {
            headers: { 'User-Agent': 'Rynote/1.0 (Discord music bot)' },
            signal: AbortSignal.timeout(10000),
          }
        )
        if (!res.ok) return L('search_failed')
        const data = await res.json()
        const list = (data.results ?? []) as OpenverseImage[]
        if (list.length === 0) return L('search_no_result', { query })
        results = list
        pageCount = Math.max(Number(data.page_count) || 1, 1)
        index = 0
        return null
      } catch {
        return L('search_failed')
      }
    }

    const render = (): any[] => {
      const img = results[index]
      const credit =
        img.creator || img.license || img.provider
          ? L('search_credit', {
              creator: img.creator || '?',
              license: img.license || '',
              provider: img.provider || '',
            })
          : ''

      return [
        {
          type: 17,
          accent_color: client.color,
          components: [
            { type: 10, content: `## ${query}` },
            {
              type: 12,
              items: [{ media: { url: img.url }, description: img.title || query }],
            },
            ...(credit
              ? [
                  { type: 14, divider: true, spacing: 1 },
                  { type: 10, content: `-# ${credit}` },
                ]
              : []),
            {
              type: 1,
              components: [
                new ButtonBuilder()
                  .setCustomId(SP_PREV)
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji(EMOJI.global.arrow_previous)
                  .setLabel(L('image_prev'))
                  .setDisabled(index <= 0)
                  .toJSON(),
                new ButtonBuilder()
                  .setCustomId('sp_page_label')
                  .setLabel(
                    client.i18n.get(handler.language, 'command.info', 'page_label_numbers', {
                      page: String(index + 1),
                      total: String(results.length),
                    })
                  )
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true)
                  .toJSON(),
                new ButtonBuilder()
                  .setCustomId(SP_NEXT)
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji(EMOJI.global.arrow_next)
                  .setLabel(L('image_next'))
                  .setDisabled(index >= results.length - 1)
                  .toJSON(),
              ],
            },
            {
              type: 1,
              components: [
                new ButtonBuilder()
                  .setCustomId(SP_SHUFFLE)
                  .setStyle(ButtonStyle.Secondary)
                  .setLabel(L('search_shuffle'))
                  .setEmoji('🔄')
                  .toJSON(),
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Link)
                  .setLabel(L('download'))
                  .setURL(img.url)
                  .toJSON(),
              ],
            },
          ],
        },
      ]
    }

    const err = await fetchPage(1)
    if (err)
      return handler.editReply({
        flags: 32768,
        components: buildV2({ color: 0xed4245, description: err }),
      } as any)

    let msg = (await handler.editReply({
      flags: 32768,
      components: render(),
    } as any)) as Message

    const update = async (components: any[]) => {
      if (handler.interaction) {
        msg = await msg.edit({ flags: 32768, components } as any)
      } else {
        await client.rest.patch(
          `/channels/${msg.channel.id}/messages/${msg.id}` as any,
          {
            body: { components, flags: 32768 },
          } as any
        )
      }
    }

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 180000,
    })

    collector.on('collect', async (i: any) => {
      try {
        if (i.user.id !== authorId) {
          if (handler.interaction)
            return i.reply({
              content: client.i18n.get(handler.language, 'command.info', 'menu_not_for_you'),
              flags: 64,
            })
          return
        }
        if (!i.deferred) await i.deferUpdate()

        if (i.customId === SP_PREV && index > 0) index -= 1
        else if (i.customId === SP_NEXT && index < results.length - 1) index += 1
        else if (i.customId === SP_SHUFFLE) {
          const page = Math.max(1, Math.floor(Math.random() * pageCount) + 1)
          const shuffleErr = await fetchPage(page)
          if (shuffleErr) return update(buildV2({ color: 0xed4245, description: shuffleErr }))
        } else return

        return update(render())
      } catch (err) {
        client.logger.error('SearchPhotoCollector', err)
      }
    })

    collector.on('end', () => {})
  }
}
