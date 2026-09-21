import { ApplicationCommandOptionType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Page } from '../../../structures/Page.js'
import { Premium } from '../../../database/schema/Premium.js'
import { buildV2 } from '../../../utilities/V2.js'
import { RYNOTE_BANNER_URL } from '../../../utilities/Links.js'

const RED = 0xed4245

export default class implements Command {
  public name = ['pmlist']
  public description = 'View all existing premium user!'
  public category = 'Premium'
  public accessableby = [Accessableby.Admin]
  public usage = ''
  public aliases = ['list', 'pml']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
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
    const value = handler.args[0]
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.premium', key, args)

    if (value && isNaN(+value))
      return handler.replyV2(
        buildV2({
          color: RED,
          description: `${client.i18n.get(handler.language, 'error', 'number_invalid')}`,
        })
      )

    const users = Array.from(await client.db.premium.all<Premium>()).map((data) => data.value)
    const pagesNum = Math.max(Math.ceil(users.length / 10), 1)

    if (value && (Number(value) < 1 || Number(value) > pagesNum))
      return handler.replyV2(
        buildV2({
          color: RED,
          description: L('list_page_notfound', { page: String(pagesNum) }),
        })
      )

    const userStrings = users.map(
      (user, i) =>
        `\`${i + 1}.\` <@${user.id}> — **${user.plan}** • ${
          user.expiresAt == 'lifetime'
            ? L('premium_lifetime')
            : `<t:${Math.floor(user.expiresAt / 1000)}:R>`
        }`
    )

    const title = L('list_title')

    const pages: any[][] = []
    for (let i = 0; i < pagesNum; i++) {
      const str = userStrings.slice(i * 10, i * 10 + 10).join('\n')

      pages.push([
        {
          type: 17,
          accent_color: client.color,
          components: [
            { type: 10, content: `## ${title}` },
            {
              type: 12,
              items: [{ media: { url: RYNOTE_BANNER_URL }, description: client.user!.username }],
            },
            { type: 14, divider: true, spacing: 1 },
            {
              type: 10,
              content:
                str == '' ? client.i18n.get(handler.language, 'command.music', 'nothing') : str,
            },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: `*${i + 1}/${pagesNum}*` },
          ],
        },
      ])
    }

    if (users.length > 10) {
      const start = value ? Math.max(0, Number(value) - 1) : 0
      if (handler.message) {
        await new Page(client, pages, 60000, handler.language, start).prefixPage(handler.message)
      } else if (handler.interaction) {
        await new Page(client, pages, 60000, handler.language, start).slashPage(handler.interaction)
      } else return
      return
    }

    return handler.replyV2(pages[0])
  }
}
