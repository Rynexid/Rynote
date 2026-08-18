import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from 'discord.js'
import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'
import { EMOJI } from '../../../utilities/Emoji.js'
const __dirname = dirname(fileURLToPath(import.meta.url))

const CATEGORY_ICONS: Record<string, string> = EMOJI.category

const HOME_BTN = 'info_home'
const MENU_BTN = 'info_menu'
const PREV_BTN = 'info_prev'
const NEXT_BTN = 'info_next'

export default class implements Command {
  public name = ['info']
  public description = 'Shows the information of the Bot'
  public category = 'Info'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = []
  public lavalink = false
  public options = []
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []

  public async execute(client: Manager, handler: CommandHandler) {
    if (handler.interaction) await handler.deferReply()

    const components = [
      ...this.homeContainer(client, handler),
      ...this.homeComponents(client, handler),
    ]
    let msg: any

    if (handler.interaction) {
      msg = await handler.editReply({ flags: MessageFlags.IsComponentsV2, components } as any)
    } else {
      msg = await handler.sendMessage({ flags: MessageFlags.IsComponentsV2, components } as any)
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

        const total = this.buildPages(client, handler).length

        if (i.customId === MENU_BTN) {
          page = 0
        } else if (i.customId === NEXT_BTN) {
          page = Math.min(page + 1, total - 1)
        } else if (i.customId === PREV_BTN) {
          page = Math.max(page - 1, 0)
        } else {
          return
        }

        msg = await this.updateMenu(client, handler, msg, [
          ...this.categoryContainer(client, handler, page),
          ...this.navComponents(client, handler, page, total),
        ])
      } catch (err) {
        client.logger.error('InfoCollector', err)
      }
    })

    collector.on('end', () => {})
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

  private getCategories(client: Manager, handler: CommandHandler) {
    const base = join(__dirname, '..', '..', '..', 'commands')
    const cats = new Set<string>()
    for (const mode of ['slash', 'prefix']) {
      const modePath = join(base, mode)
      try {
        for (const cat of readdirSync(modePath)) cats.add(cat)
      } catch {}
    }
    const isOwner = this.isOwner(client, handler)
    return [...cats].filter((cat) => {
      if (cat === 'Owner' && !isOwner) return false
      if (cat === 'Dev' && !isOwner) return false
      const cmds = client.commands.filter(
        (c) => c.category === cat && (handler.interaction ? c.usingInteraction : true)
      )
      if (cat === 'Premium' && !isOwner) {
        return cmds.some((c) => this.isPremiumVisible(c))
      }
      return cmds.size > 0
    })
  }

  private buildPages(client: Manager, handler: CommandHandler) {
    const cats = this.getCategories(client, handler)
    const pages: { title: string; lines: string[] }[] = []
    const isOwner = this.isOwner(client, handler)

    for (const cat of cats) {
      let cmds = client.commands.filter(
        (c) => c.category === cat && (handler.interaction ? c.usingInteraction : true)
      )
      if (!isOwner && cat === 'Premium') cmds = cmds.filter((c) => this.isPremiumVisible(c))
      if (!isOwner && cat === 'Dev') cmds = cmds.filter(() => false)
      if (cmds.size === 0) continue

      const icon = CATEGORY_ICONS[cat] ?? '•'
      const entries = [...cmds.values()].map((c) => {
        const alias =
          c.aliases && c.aliases.length !== 0 ? ` (\`${c.aliases.join('\`, \`')}\`)` : ''
        return `> \`${c.name.join(' ')}\`${alias} — ${this.getDesc(client, handler, c)}`
      })

      const chunkSize = 15
      for (let i = 0; i < entries.length; i += chunkSize) {
        pages.push({
          title: `${icon} ${cat} \`[${cmds.size}]\``,
          lines: entries.slice(i, i + chunkSize),
        })
      }
    }

    return pages
  }

  private homeComponents(client: Manager, handler: CommandHandler) {
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(MENU_BTN)
          .setLabel(client.i18n.get(handler.language, 'command.info', 'menu_list'))
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
    const users = client.guilds.cache.reduce((a, b) => a + (b.memberCount || 0), 0)
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.info', key, args)
    const info =
      `- ${L('info_codename')} ${client.manifest.metadata.bot.codename}\n` +
      `- ${L('info_version')} ${client.manifest.metadata.bot.version}\n` +
      `- ${L('info_node')} ${process.version}\n` +
      `- ${L('info_discordjs')} ${client.manifest.package.discordjs}\n` +
      `- ${L('info_rainlink')} ${client.manifest.package.rainlink}\n` +
      `- ${L('info_guilds')} ${client.guilds.cache.size}\n` +
      `- ${L('info_users')} ${users}\n` +
      `- ${L('info_commands')} ${client.commands.size}`

    return [
      {
        type: 17,
        accent_color: client.color,
        components: [
          { type: 10, content: L('info_title', { username: client.user!.username }) },
          { type: 14, divider: true, spacing: 1 },
          { type: 10, content: info },
          { type: 14, divider: true, spacing: 1 },
          {
            type: 10,
            content: L('info_footer', { menu: EMOJI.global.menu }),
          },
        ],
      },
    ]
  }

  private categoryContainer(client: Manager, handler: CommandHandler, page: number) {
    const pages = this.buildPages(client, handler)
    const current = pages[page]
    const content = `## ${current.title}\n${client.i18n.get(handler.language, 'command.info', 'page_label', {
      page: String(page + 1),
      total: String(pages.length),
    })}\n\n${current.lines.join('\n')}`

    return [
      {
        type: 17,
        accent_color: client.color,
        components: [{ type: 10, content }],
      },
    ]
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
}
