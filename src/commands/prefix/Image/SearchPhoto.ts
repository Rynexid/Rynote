import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'
import { ApplicationCommandOptionType, ComponentType, Message } from 'discord.js'
import { buildV2 } from '../../../utilities/V2.js'

const SIZES = [512, 1024, 1920]

export default class implements Command {
  public name = ['searchphoto']
  public description = 'Search for a photo from the web by keyword'
  public category = 'Image'
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
    const tags = encodeURIComponent(query.split(/\s+/).join(','))
    const seed = Math.floor(Math.random() * 1e9)
    let size = 1024

    const render = (s: number) => {
      const url = `https://loremflickr.com/${s}/${s}/${tags}?lock=${seed}`
      return buildV2({
        color: client.color,
        title: `${query} \`[${s}px]\``,
        image: url,
        buttons: [
          SIZES.map((sz) => ({
            label: `${sz}px`,
            customId: `sp_size_${sz}`,
            style: sz === s ? 2 : 1,
          })),
          [
            {
              label: client.i18n.get(handler.language, 'command.image', 'download'),
              url,
              style: 5,
            },
          ],
        ],
      })
    }

    let msg = (await handler.editReply({
      flags: 32768,
      components: render(size),
    } as any)) as Message

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

        if (i.customId.startsWith('sp_size_')) {
          size = parseInt(i.customId.replace('sp_size_', ''), 10)
        } else return

        const components = render(size)

        if (handler.interaction) {
          msg = await i.update({ flags: 32768, components } as any)
        } else {
          await client.rest.patch(
            `/channels/${msg.channel.id}/messages/${msg.id}` as any,
            { body: { components, flags: 32768 } } as any
          )
        }
      } catch (err) {
        client.logger.error('SearchPhotoCollector', err)
      }
    })

    collector.on('end', () => {})
  }
}
