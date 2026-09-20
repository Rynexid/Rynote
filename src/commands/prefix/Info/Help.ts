import {
  ApplicationCommandOptionType,
  MessageFlags,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Collection,
} from 'discord.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'
import { EMOJI } from '../../../utilities/Emoji.js'
import { RYNOTE_BANNER_URL } from '../../../utilities/Links.js'

const CATEGORY_ICONS: Record<string, string> = EMOJI.category

const PREV_BTN = 'help_prev'
const NEXT_BTN = 'help_next'
const HOME_BTN = 'help_home'

const HOME_PAGES: [string, string][][] = [
  [
    ['Music', 'Musik'],
    ['Filter', 'Filter'],
    ['Playlist', 'Playlists'],
  ],
  [
    ['Info', 'Info'],
    ['Utils', 'Utils'],
  ],
  [['Premium', 'Premium']],
  [['Profile', 'Profile']],
  [['Owner', 'Owner']],
]

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
    if (handler.args[0]) {
      return this.replyCommandDetail(client, handler)
    }

    return this.replyHome(client, handler)
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

  private getPages(client: Manager, handler: CommandHandler): [string, string][][] {
    const pages = HOME_PAGES.map((p) => p)
    if (!this.isOwner(client, handler)) pages.pop()
    return pages
  }

  private async replyHome(client: Manager, handler: CommandHandler) {
    const pages = this.getPages(client, handler)
    const total = pages.length + 1
    const components = [
      ...this.homeContainer(client, handler, 0, pages),
      ...this.navComponents(client, handler, 0, total),
    ]
    let msg = await handler.replyV2(components)

    let page = 0

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 180000,
      filter: (i: any) =>
        i.user.id === (handler.interaction?.user.id ?? handler.message?.author.id),
    })

    collector.on('collect', async (i: any) => {
      try {
        await i.deferUpdate()

        if (i.customId === HOME_BTN) page = 0
        else if (i.customId === NEXT_BTN) page = Math.min(page + 1, total - 1)
        else if (i.customId === PREV_BTN) page = Math.max(page - 1, 0)
        else return

        msg = await this.updateMenu(client, handler, msg, [
          ...this.homeContainer(client, handler, page, pages),
          ...this.navComponents(client, handler, page, total),
        ])
      } catch (err) {
        client.logger.error('HelpCollector', err)
      }
    })
  }

  private async updateMenu(
    client: Manager,
    handler: CommandHandler,
    oldMsg: any,
    components: any[]
  ) {
    if (handler.interaction) {
      return oldMsg.edit({ flags: MessageFlags.IsComponentsV2, components } as any)
    }
    const route = `/channels/${oldMsg.channel.id}/messages/${oldMsg.id}` as any
    await client.rest.patch(route, {
      body: { components, flags: MessageFlags.IsComponentsV2 },
    } as any)
    return oldMsg
  }

  private navComponents(client: Manager, handler: CommandHandler, page: number, total: number) {
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(HOME_BTN)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJI.global.home)
          .setDisabled(page <= 0),
        new ButtonBuilder()
          .setCustomId(PREV_BTN)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJI.global.arrow_previous)
          .setDisabled(page <= 0),
        new ButtonBuilder()
          .setCustomId('help_page_label')
          .setLabel(
            client.i18n.get(handler.language, 'command.info', 'page_label_numbers', {
              page: String(page + 1),
              total: String(total),
            })
          )
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(NEXT_BTN)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJI.global.arrow_next)
          .setDisabled(page >= total - 1)
      ),
    ]
  }

  private homeContainer(
    client: Manager,
    handler: CommandHandler,
    page: number,
    pages: [string, string][][]
  ) {
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.info', key, args)

    if (page === 0) {
      const cats = new Set(
        client.commands
          .filter((c) => (handler.interaction ? c.usingInteraction : true))
          .map((c) => c.category)
      ).size

      const content =
        `${L('help_welcome', { emoji: EMOJI.global.home, username: client.user!.username })}\n` +
        `${L('help_welcome_desc', { username: client.user!.username })}\n\n` +
        `- ${L('help_total')} ${client.commands.size}\n` +
        `- ${L('help_cats')} ${cats}\n` +
        `- ${L('help_owner')} <@${client.owner}>\n\n` +
        `${L('help_footer')}`

      return [
        {
          type: 17,
          accent_color: client.color,
          components: [
            {
              type: 12,
              items: [{ media: { url: RYNOTE_BANNER_URL }, description: client.user!.username }],
            },
            { type: 10, content },
          ],
        },
      ]
    }

    const sections = pages[page - 1]
      .map(([cat, label]) => {
        const isOwner = this.isOwner(client, handler)
        if (cat === 'Owner' && !isOwner) return null
        const mergedCats = cat === 'Owner' ? ['Owner', 'Dev'] : [cat]
        let cmds = client.commands.filter(
          (c) =>
            mergedCats.includes(c.category) && (handler.interaction ? c.usingInteraction : true)
        )
        if (cat === 'Premium' && !isOwner) {
          cmds = cmds.filter((c) => this.isPremiumVisible(c))
        }
        if (cmds.size === 0) return null
        return `### ${CATEGORY_ICONS[cat] ?? '•'} ${label}\n${this.namesLine(cmds)}`
      })
      .filter((s): s is string => s !== null)
      .join('\n\n')

    const content = sections + `\n\n${L('help_footer')}`

    return [
      {
        type: 17,
        accent_color: client.color,
        components: [{ type: 10, content }],
      },
    ]
  }

  private namesLine(cmds: Collection<string, Command>): string {
    return cmds.map((c) => `\`${c.name.join(' ')}\``).join(', ')
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
                  command: `.${this.name[0]}`,
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

    const e = this.transalatedFinder(client, handler)
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.info', key, args)

    const icon = CATEGORY_ICONS[command.category] ?? '•'
    const prefixChar = handler.prefix || '.'
    const usage = command.usage ? ` ${command.usage}` : ''
    const desc = this.getDesc(client, handler, command)

    const accessLabels =
      command.accessableby?.map((a) => this.accessLabel(client, handler, a)).join(', ') ||
      L('access_member')

    const aliasesLine = command.aliases?.length
      ? `${e.aliases} \`${command.aliases.join('`, `')}\``
      : `${e.aliases} ${e.aliasesNone}`

    const optionsBlock = command.options?.length
      ? command.options
          .map((o) => {
            const badge = `${this.optionTypeName(o.type)}${
              o.required ? ` • ${L('ce_finder_required')}` : ''
            }`
            const oDesc = o.description ? ` — ${o.description}` : ''
            return `• \`${o.name}\` (${badge})${oDesc}`
          })
          .join('\n')
      : L('ce_finder_options_none')

    const content = [
      `## ${icon} ${command.name.join(' / ')}`,
      `> ${desc}`,
      '',
      e.usage,
      `• ${L('ce_finder_via_slash')}: \`/${command.name.join(' ')}${usage}\``,
      `• ${L('ce_finder_via_prefix')}: \`${prefixChar}${command.name.join(' ')}${usage}\``,
      aliasesLine,
      '',
      L('ce_finder_options'),
      optionsBlock,
      '',
      `${L('ce_finder_category')} ${icon} ${command.category} • ${e.access} ${accessLabels} • ${
        e.slash
      } \`${command.usingInteraction ? e.slashEnable : e.slashDisable}\``,
    ].join('\n')

    const componentsV2 = [
      {
        type: 17,
        accent_color: client.color,
        components: [
          {
            type: 10,
            content,
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

  private accessLabel(client: Manager, handler: CommandHandler, access: Accessableby): string {
    const map: Record<string, string> = {
      Member: 'access_member',
      Owner: 'access_owner',
      Admin: 'access_admin',
      Dev: 'access_dev',
      Premium: 'access_premium',
      GuildPremium: 'access_guild_premium',
      Voter: 'access_voter',
      Manager: 'access_manager',
    }
    return client.i18n.get(handler.language, 'command.info', map[access] ?? 'access_member')
  }

  private optionTypeName(type?: ApplicationCommandOptionType): string {
    return (
      {
        [ApplicationCommandOptionType.String]: 'String',
        [ApplicationCommandOptionType.Integer]: 'Integer',
        [ApplicationCommandOptionType.Number]: 'Number',
        [ApplicationCommandOptionType.Boolean]: 'Boolean',
        [ApplicationCommandOptionType.User]: 'User',
        [ApplicationCommandOptionType.Channel]: 'Channel',
        [ApplicationCommandOptionType.Role]: 'Role',
        [ApplicationCommandOptionType.Mentionable]: 'Mentionable',
        [ApplicationCommandOptionType.Subcommand]: 'Subcommand',
        [ApplicationCommandOptionType.SubcommandGroup]: 'Subcommand Group',
      }[type as number] ?? '-'
    )
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
