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

const ANM_RANDOM = 'anm_random'

type NekoImage = {
  id: number
  url: string
  rating?: string
  tags?: string[]
  artist_name?: string | null
  source_url?: string | null
}

export default class implements Command {
  public name = ['anime']
  public description = 'Get a random SFW anime artwork, or search by tag'
  public category = 'Info'
  public accessableby = [Accessableby.Member]
  public usage = '<tag (optional)>'
  public aliases = ['waifu']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'tag',
      description: 'Filter by tag (e.g. neko, catgirl, wallpaper)',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.image', key, args)

    const query = (handler.interaction ? handler.args[0] : handler.args.join(' ')).trim()
    const authorId = handler.interaction?.user.id ?? handler.message?.author.id

    let current: NekoImage | null = null

    const fetchOne = async (): Promise<string | null> => {
      let url = 'https://api.nekosapi.com/v4/images/random?limit=1&rating=safe'
      if (query) url += `&tags=${encodeURIComponent(query)}`
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Rynote/1.0 (Discord music bot)' },
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) return L('anime_failed')
        const data = await res.json()
        const list = Array.isArray(data) ? (data as NekoImage[]) : []
        if (list.length === 0) return L('anime_none', { query })
        current = list[0]
        return null
      } catch {
        return L('anime_failed')
      }
    }

    const render = (): any[] => {
      const img = current as NekoImage
      const tags = (img.tags?.slice(0, 8) ?? []).join(', ')

      return [
        {
          type: 17,
          accent_color: client.color,
          components: [
            {
              type: 10,
              content: `# 🎴 ${L('anime_title')}${query ? ` — ${query}` : ''}`,
            },
            {
              type: 12,
              items: [{ media: { url: img.url }, description: `${L('anime_title')} ${img.id}` }],
            },
            ...(tags
              ? [
                  { type: 14, divider: true, spacing: 1 },
                  { type: 10, content: `-# ${L('anime_tags')}: ${tags}` },
                ]
              : []),
            {
              type: 1,
              components: [
                new ButtonBuilder()
                  .setCustomId(ANM_RANDOM)
                  .setStyle(ButtonStyle.Secondary)
                  .setLabel(L('anime_random'))
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

    const err = await fetchOne()
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

        if (i.customId === ANM_RANDOM) {
          const randomErr = await fetchOne()
          if (randomErr) return update(buildV2({ color: 0xed4245, description: randomErr }))
          return update(render())
        }
        return
      } catch (err) {
        client.logger.error('AnimeCollector', err)
      }
    })

    collector.on('end', () => {})
  }
}
