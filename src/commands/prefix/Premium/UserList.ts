import { ApplicationCommandOptionType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Page } from '../../../structures/Page.js'
import { Premium } from '../../../database/schema/Premium.js'
import { buildV2 } from '../../../utilities/V2.js'

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

    if (value && isNaN(+value))
      return handler.replyV2(
        buildV2({
          color: client.color as number,
          description: `${client.i18n.get(handler.language, 'error', 'number_invalid')}`,
        })
      )

    const users = Array.from(await client.db.premium.all<Premium>()).map((data) => data.value)
    let pagesNum = Math.ceil(users.length / 10)
    if (pagesNum === 0) pagesNum = 1

    const userStrings = []
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      userStrings.push(`\`${i + 1}. ${user.redeemedBy.username}/${user.id} - ${user.plan}\``)
    }

    const pages: any[][] = []
    for (let i = 0; i < pagesNum; i++) {
      const str = userStrings.slice(i * 10, i * 10 + 10).join('\n')

      const authorName = `${client.i18n.get(handler.language, 'command.premium', 'list_title')}`
      const description = str == '' ? client.i18n.get(handler.language, 'command.music', 'nothing') : '\n' + str

      pages.push([
        {
          type: 17,
          accent_color: client.color,
          components: [
            { type: 10, content: `## ${authorName}` },
            { type: 10, content: description },
          ],
        },
      ])
    }

    if (!value) {
      if (pages.length == pagesNum && users.length > 10) {
        if (handler.message) {
          await new Page(client, pages, 60000, handler.language).prefixPage(handler.message)
        } else if (handler.interaction) {
          await new Page(client, pages, 60000, handler.language).slashPage(handler.interaction)
        } else return
      } else {
        const pageStr = userStrings.slice(0, 10).join('\n')
        return handler.replyV2(
          buildV2({
            color: client.color as number,
            title: `${client.i18n.get(handler.language, 'command.premium', 'list_title')}`,
            description: pageStr == '' ? client.i18n.get(handler.language, 'command.music', 'nothing') : '\n' + pageStr,
            footer: `1/${String(pagesNum)}`,
          })
        )
      }
    } else {
      if (isNaN(+value))
        return handler.replyV2(
          buildV2({
            color: client.color as number,
            description: `${client.i18n.get(handler.language, 'command.premium', 'list_notnumber')}`,
          })
        )
      if (Number(value) > pagesNum)
        return handler.replyV2(
          buildV2({
            color: client.color as number,
            description: `${client.i18n.get(
              handler.language,
              'command.premium',
              'list_page_notfound',
              {
                page: String(pagesNum),
              }
            )}`,
          })
        )
      const pageNum = Number(value) == 0 ? 1 : Number(value) - 1
      const pageStr = userStrings.slice(pageNum * 10, pageNum * 10 + 10).join('\n')
      return handler.replyV2(
        buildV2({
          color: client.color as number,
          title: `${client.i18n.get(handler.language, 'command.premium', 'list_title')}`,
          description: pageStr == '' ? client.i18n.get(handler.language, 'command.music', 'nothing') : '\n' + pageStr,
          footer: `${String(pageNum + 1)}/${String(pagesNum)}`,
        })
      )
    }
  }
}
