import {
  ApplicationCommandOptionType,
  MessageFlags,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from 'discord.js'
import { readdirSync } from 'fs'
import { stripIndents } from 'common-tags'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'
import { EMOJI } from '../../../utilities/Emoji.js'
import { RYNOTE_BANNER_FILE, RYNOTE_BANNER_URL } from '../../../utilities/GetRynoteBanner.js'
const __dirname = dirname(fileURLToPath(import.meta.url))

const CATEGORY_ICONS: Record<string, string> = EMOJI.category

const HOME_BTN = 'help_home_menu'
const MENU_BTN = 'help_open_menu'
const PREV_BTN = 'help_prev'
const NEXT_BTN = 'help_next'

export default class implements Command {
  public name = ['help']
  public description = 'Displays all commands that the bot has.'
  public category = 'Info'
  public accessableby = [Accessableby.Member]
  public usage = '<command_name>'
  public aliases = ['h']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'command',
      description: 'The command name',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    if (handler.interaction) await handler.deferReply()

    if (handler.args[0]) {
      return this.replyCommandDetail(client, handler)
    }

    return this.replyHome(client, handler)
  }

  private getCategories(client: Manager, handler?: CommandHandler) {
    const base = join(__dirname, '..', '..', '..', 'commands')
    const cats = new Set<string>()
    for (const mode of ['slash', 'prefix']) {
      const modePath = join(base, mode)
      try {
        for (const cat of readdirSync(modePath)) cats.add(cat)
      } catch {}
    }
    const isOwner = handler ? this.isOwner(client, handler) : false
    return [...cats].filter((cat) => {
      if (cat === 'Owner' && !isOwner) return false
      if (cat === 'Dev' && !isOwner) return false
      const cmds = client.commands.filter(
        (c) => c.category === cat && (handler?.interaction ? c.usingInteraction : true)
      )
      if (cat === 'Premium' && !isOwner) {
        return cmds.some((c) => this.isPremiumVisible(c))
      }
      return cmds.size > 0
    })
  }

  private isOwner(client: Manager, handler: CommandHandler): boolean {
    const userId = handler.interaction?.user.id ?? handler.message?.author.id
    return userId === client.owner
  }

  private isPremiumVisible(command: Command): boolean {
    const visibleCommands = ['pmlist', 'pmglist', 'pmprofile', 'pmgprofile']
    return visibleCommands.includes(command.name[0])
  }

  private getDesc(client: Manager, handler: CommandHandler, c: Command): string {
    const key = c.name.join('_')
    if (client.i18n.has(handler.language, 'command.desc', key))
      return client.i18n.get(handler.language, 'command.desc', key)
    return c.description || client.i18n.get(handler.language, 'command.info', 'ce_finder_des_no')
  }

  private homeComponents(client: Manager, handler: CommandHandler) {
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(MENU_BTN)
          .setLabel(client.i18n.get(handler.language, 'command.info', 'help_menu_btn'))
          .setStyle(ButtonStyle.Primary)
          .setEmoji(EMOJI.global.menu)
      ),
    ]
  }

  private navComponents(client: Manager, handler: CommandHandler, page: number, total: number) {
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(HOME_BTN)
          .setLabel(client.i18n.get(handler.language, 'command.info', 'menu_home'))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJI.global.home),
        new ButtonBuilder()
          .setCustomId(PREV_BTN)
          .setLabel(client.i18n.get(handler.language, 'command.info', 'menu_prev'))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJI.global.arrow_previous)
          .setDisabled(page <= 0),
        new ButtonBuilder()
          .setCustomId(NEXT_BTN)
          .setLabel(client.i18n.get(handler.language, 'command.info', 'menu_next'))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJI.global.arrow_next)
          .setDisabled(page >= total - 1)
      ),
    ]
  }

  private homeContainer(client: Manager, handler: CommandHandler) {
    const total = client.commands.size
    const cats = this.getCategories(client, handler).length
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.info', key, args)
    return [
      {
        type: 17,
        accent_color: client.color,
        components: [
          {
            type: 12,
            items: [{ media: { url: RYNOTE_BANNER_URL }, description: client.user!.username }],
          },
          {
            type: 10,
            content:
              `${L('help_welcome', { emoji: EMOJI.global.home, username: client.user!.username })}\n` +
              `${L('help_welcome_desc', { username: client.user!.username })}\n\n` +
              `- ${L('help_total')} ${total}\n` +
              `- ${L('help_cats')} ${cats}\n` +
              `- ${L('help_owner')} <@${client.owner}>\n\n` +
              `${L('help_footer')}`,
          },
        ],
      },
    ]
  }

  private categoryContainer(client: Manager, handler: CommandHandler, page: number) {
    const categories = this.getCategories(client, handler)
    const category = categories[page]
    let cmds = client.commands.filter((c) => c.category === category)
    const isOwner = this.isOwner(client, handler)
    if (!isOwner && category === 'Premium') {
      cmds = cmds.filter((c) => this.isPremiumVisible(c))
    }
    if (!isOwner && category === 'Dev') {
      cmds = cmds.filter(() => false)
    }
    const icon = CATEGORY_ICONS[category] ?? '•'

    const list = cmds
      .filter((c) => (handler.interaction ? c.usingInteraction : true))
      .map((c) => `**${c.name.join(' ')}**`)
      .join(', ')

    return [
      {
        type: 17,
        accent_color: client.color,
        components: [
          {
            type: 10,
            content:
              `## ${icon} ${category} \`[${cmds.size}]\`\n` +
              `${client.i18n.get(handler.language, 'command.info', 'page_label', {
                page: String(page + 1),
                total: String(categories.length),
              })}\n\n` +
              list,
          },
        ],
      },
    ]
  }

  private async replyHome(client: Manager, handler: CommandHandler) {
    const components = [
      ...this.homeContainer(client, handler),
      ...this.homeComponents(client, handler),
    ]
    let msg: any

    if (handler.interaction) {
      msg = await handler.editReply({
        flags: MessageFlags.IsComponentsV2,
        components,
        files: [RYNOTE_BANNER_FILE],
      } as any)
    } else {
      msg = await handler.sendMessage({
        flags: MessageFlags.IsComponentsV2,
        components,
        files: [RYNOTE_BANNER_FILE],
      } as any)
    }

    let page = -1

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 180000,
    })

    collector.on('collect', async (i: any) => {
      try {
        if (i.user.id !== (handler.interaction?.user.id ?? handler.message?.author.id)) {
          if (handler.interaction) {
            return i.reply({
              content: client.i18n.get(handler.language, 'command.info', 'menu_not_for_you'),
              flags: MessageFlags.Ephemeral,
            })
          }
          return
        }

        if (!i.deferred) await i.deferUpdate()

        if (i.customId === HOME_BTN) {
          page = -1
          msg = await this.updateMenu(client, handler, msg, [
            ...this.homeContainer(client, handler),
            ...this.homeComponents(client, handler),
          ])
          return
        }

        if (i.customId === MENU_BTN) {
          page = 0
        } else if (i.customId === NEXT_BTN) {
          const total = this.getCategories(client, handler).length
          page = Math.min(page + 1, total - 1)
        } else if (i.customId === PREV_BTN) {
          page = Math.max(page - 1, 0)
        } else {
          return
        }

        const total = this.getCategories(client, handler).length
        msg = await this.updateMenu(client, handler, msg, [
          ...this.categoryContainer(client, handler, page),
          ...this.navComponents(client, handler, page, total),
        ])
      } catch (err) {
        client.logger.error('HelpCollector', err)
      }
    })

    collector.on('end', () => {})
  }

  private async updateMenu(
    client: Manager,
    handler: CommandHandler,
    oldMsg: any,
    components: any[]
  ) {
    if (handler.interaction) {
      return oldMsg.edit({ flags: 32768, components } as any)
    }
    const route = `/channels/${oldMsg.channel.id}/messages/${oldMsg.id}` as any
    await client.rest.patch(route, {
      body: { components, flags: 32768 },
    } as any)
    return oldMsg
  }

  private async replyCommandDetail(client: Manager, handler: CommandHandler) {
    let command = client.commands.get(
      client.aliases.get(handler.args[0].toLowerCase()) || handler.args[0].toLowerCase()
    )
    if (!command) {
      const invalidComponents = [
        {
          type: 17,
          accent_color: client.color,
          components: [
            {
              type: 10,
              content:
                `## ${client.i18n.get(handler.language, 'command.info', 'ce_finder_invalid')}\n` +
                `${client.i18n.get(handler.language, 'command.info', 'ce_finder_example', {
                  command: `${handler.prefix}${this.name[0]}`,
                })}`,
            },
          ],
        },
      ]
      return handler.interaction
        ? handler.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: invalidComponents,
          } as any)
        : handler.sendMessage({
            flags: MessageFlags.IsComponentsV2,
            components: invalidComponents,
          } as any)
    }

    const isOwner = this.isOwner(client, handler)
    if (!isOwner && command.category === 'Premium' && !this.isPremiumVisible(command)) {
      const invalidComponents = [
        {
          type: 17,
          accent_color: client.color,
          components: [
            {
              type: 10,
              content:
                `## ${client.i18n.get(handler.language, 'command.info', 'ce_finder_invalid')}\n` +
                `${client.i18n.get(handler.language, 'command.info', 'cmd_not_public')}`,
            },
          ],
        },
      ]
      return handler.interaction
        ? handler.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: invalidComponents,
          } as any)
        : handler.sendMessage({
            flags: MessageFlags.IsComponentsV2,
            components: invalidComponents,
          } as any)
    }

    const eString = this.transalatedFinder(client, handler)

    const componentsV2 = [
      {
        type: 17,
        accent_color: client.color,
        components: [
          {
            type: 10,
            content:
              `## ${command.name.join(' / ')}\n` +
              `> ${this.getDesc(client, handler, command)}\n\n` +
              `- ${eString.usage} ${
                command.usage
                  ? `\`${handler.prefix}${command.name.join(' ')} ${command.usage}\``
                  : `\`${eString.usageNone}\``
              }\n` +
              `- ${eString.access} \`${command.accessableby}\`\n` +
              `- ${eString.aliases} \`${
                command.aliases && command.aliases.length !== 0
                  ? command.aliases.join(', ') + eString.aliasesPrefix
                  : eString.aliasesNone
              }\`\n` +
              `- ${eString.slash} \`${command.usingInteraction ? eString.slashEnable : eString.slashDisable}\``,
          },
        ],
      },
    ]

    return handler.interaction
      ? handler.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: componentsV2,
        } as any)
      : handler.sendMessage({
          flags: MessageFlags.IsComponentsV2,
          components: componentsV2,
        } as any)
  }

  private transalatedFinder(client: Manager, handler: CommandHandler) {
    return {
      name: `${client.i18n.get(handler.language, 'command.info', 'ce_finder_name')}`,
      des: `${client.i18n.get(handler.language, 'command.info', 'ce_finder_des')}`,
      usage: `${client.i18n.get(handler.language, 'command.info', 'ce_finder_usage')}`,
      access: `${client.i18n.get(handler.language, 'command.info', 'ce_finder_access')}`,
      aliases: `${client.i18n.get(handler.language, 'command.info', 'ce_finder_aliases')}`,
      slash: `${client.i18n.get(handler.language, 'command.info', 'ce_finder_slash')}`,
      desNone: `${client.i18n.get(handler.language, 'command.info', 'ce_finder_des_no')}`,
      usageNone: `${client.i18n.get(handler.language, 'command.info', 'ce_finder_usage_no')}`,
      aliasesPrefix: `${client.i18n.get(handler.language, 'command.info', 'ce_finder_aliases_prefix')}`,
      aliasesNone: `${client.i18n.get(handler.language, 'command.info', 'ce_finder_aliases_no')}`,
      slashEnable: `${client.i18n.get(handler.language, 'command.info', 'ce_finder_slash_enable')}`,
      slashDisable: `${client.i18n.get(handler.language, 'command.info', 'ce_finder_slash_disable')}`,
    }
  }
}
