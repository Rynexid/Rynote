import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

const GUILDS_PER_PAGE = 5

export default class implements Command {
  public name = ['serverlist']
  public description = 'Show the list of all servers the bot is in!'
  public category = 'Owner'
  public accessableby = [Accessableby.Owner]
  public usage = ''
  public aliases = ['sl']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const guilds = [...client.guilds.cache.values()]
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.owner', key, args)

    if (!guilds.length)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: L('sl_empty'),
          color: client.color,
        }),
      } as any)

    const totalPages = Math.ceil(guilds.length / GUILDS_PER_PAGE)
    let page = 0

    const buildList = (current: number) => {
      const offset = current * GUILDS_PER_PAGE
      const slice = guilds.slice(offset, offset + GUILDS_PER_PAGE)

      const entries = slice
        .map((guild, i) => {
          const index = offset + i + 1
          const owner = client.users.cache.get(guild.ownerId)?.username ?? guild.ownerId
          const player = client.rainlink.players.get(guild.id)
          const status = player?.playing ? L('sl_status_playing') : L('sl_status_idle')
          return `${L('sl_index', {
            index: String(index).padStart(2, '0'),
            name: guild.name,
          })}\n${L('sl_metadata', {
            id: guild.id,
            members: guild.memberCount.toLocaleString('en-US'),
            boosts: `${guild.premiumSubscriptionCount ?? 0}`,
            owner,
          })}\n${L('sl_status', { status })}`
        })
        .join('\n\n')

      return buildV2({
        title: L('sl_title'),
        description: `${L('sl_desc', {
          guilds: client.guilds.cache.size.toLocaleString('en-US'),
          users: client.guilds.cache.reduce((a, b) => a + b.memberCount, 0).toLocaleString('en-US'),
          shards: `${client.ws.shards.size}`,
        })}\n\n${entries}`,
        footer: L('sl_page', {
          current: `${current + 1}`,
          total: `${totalPages}`,
        }),
        color: client.color,
      })
    }

    const pagination = (disable: boolean) =>
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('sl_prev')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(L('sl_prev'))
          .setDisabled(disable || page === 0),
        new ButtonBuilder()
          .setCustomId('sl_next')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(L('sl_next'))
          .setDisabled(disable || page === totalPages - 1)
      )

    const current = (disable = false) => [...buildList(page), pagination(disable)]

    const msg = await handler.editReply({ flags: 32768, components: current() } as any)

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    })

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'sl_prev') page = Math.max(0, page - 1)
      else if (interaction.customId === 'sl_next') page = Math.min(totalPages - 1, page + 1)
      else return

      await msg.edit({ flags: 32768, components: current() } as any).catch(() => {})
    })

    collector.on('end', async () => {
      await msg.edit({ flags: 32768, components: current(true) } as any).catch(() => {})
    })

    return
  }
}
