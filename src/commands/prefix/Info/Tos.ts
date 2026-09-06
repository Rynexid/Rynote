import { ComponentType, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'
import { RYNOTE_SUPPORT } from '../../../utilities/Links.js'

const PREV_BTN = 'tos_prev'
const SUPPORT_BTN = 'tos_support'
const NEXT_BTN = 'tos_next'

export default class implements Command {
  public name = ['tos']
  public description = "View the bot's Terms of Service and usage guidelines."
  public category = 'Info'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['terms', 'termsofservice', 'rules']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = []

  private pages(client: Manager, handler: CommandHandler): string[] {
    const bot = client.user!.username
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.info', key, args)
    return [L('tos_page1', { bot }), L('tos_page2', { bot }), L('tos_page3', { bot })]
  }

  private navComponents(
    client: Manager,
    handler: CommandHandler,
    page: number,
    total: number
  ): any[] {
    const prev = new ButtonBuilder()
      .setCustomId(PREV_BTN)
      .setLabel(client.i18n.get(handler.language, 'command.info', 'menu_prev'))
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0)

    const support = new ButtonBuilder()
      .setLabel(client.i18n.get(handler.language, 'command.info', 'btn_support'))
      .setStyle(ButtonStyle.Link)
      .setURL(RYNOTE_SUPPORT)

    const next = new ButtonBuilder()
      .setCustomId(NEXT_BTN)
      .setLabel(client.i18n.get(handler.language, 'command.info', 'menu_next'))
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === total - 1)

    return [new ActionRowBuilder<ButtonBuilder>().addComponents(prev, support, next)]
  }

  private container(client: Manager, handler: CommandHandler, page: number, total: number): any[] {
    const content = this.pages(client, handler)[page]
    const header = client.i18n.get(handler.language, 'command.info', 'tos_header', {
      page: String(page + 1),
      total: String(total),
    })
    return [
      { content: header, type: 10 },
      { content, type: 10 },
    ]
  }

  public async execute(client: Manager, handler: CommandHandler) {
    const pages = this.pages(client, handler)
    const total = pages.length
    let page = 0

    const sentMsg = await handler.replyV2([
      ...this.container(client, handler, page, total),
      ...this.navComponents(client, handler, page, total),
    ] as any)

    const msg: any = sentMsg
    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 180000,
    })

    collector.on('collect', async (i: any) => {
      try {
        if (i.user.id !== (handler.interaction?.user.id ?? handler.message?.author.id)) {
          return i.reply({
            content: client.i18n.get(handler.language, 'command.info', 'menu_not_for_you'),
            flags: 64,
          })
        }

        await i.deferUpdate()

        if (i.customId === NEXT_BTN) {
          page = Math.min(page + 1, total - 1)
        } else if (i.customId === PREV_BTN) {
          page = Math.max(page - 1, 0)
        } else {
          return
        }

        const route = `/channels/${msg.channel.id}/messages/${msg.id}` as any
        await client.rest.patch(route, {
          body: {
            components: [
              ...this.container(client, handler, page, total),
              ...this.navComponents(client, handler, page, total),
            ],
            flags: 32768,
          },
        } as any)
      } catch (err) {
        client.logger.error('TosCollector', err)
      }
    })

    collector.on('end', () => {})
  }
}
