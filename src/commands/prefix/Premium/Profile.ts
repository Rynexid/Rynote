import { ApplicationCommandOptionType, User } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler, ParseMentionEnum } from '../../../structures/CommandHandler.js'
import { Premium } from '../../../database/schema/Premium.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['pmprofile']
  public description = 'View your premium profile!'
  public category = 'Premium'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['profile']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'user',
      description: 'Type your user here',
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    let user = handler.user
    const data = handler.args[0]
    const getData = await handler.parseMentions(data)
    if (data && getData && getData.type == ParseMentionEnum.USER) user = getData.data as User

    if (user?.id == client.owner) return this.owner(client, handler)
    if (client.config.bot.ADMIN.includes(user?.id ?? 'null')) return this.admin(client, handler)

    const PremiumPlan = (await client.db.premium.get(`${handler.user?.id}`)) as Premium

    if (!PremiumPlan) {
      return handler.replyV2(
        buildV2({
          color: client.color as number,
          title: `${client.i18n.get(handler.language, 'command.premium', 'profile_author')}`,
          description: `${client.i18n.get(handler.language, 'command.premium', 'profile_error_desc', { user: String(user?.username) })}`,
        })
      )
    }

    return handler.replyV2(
      buildV2({
        color: client.color as number,
        title: `${client.i18n.get(handler.language, 'command.premium', 'profile_author')}`,
        description: `${client.i18n.get(handler.language, 'command.premium', 'profile_desc', {
          user: String(handler.user?.tag),
          plan: PremiumPlan!.plan,
          expires:
            PremiumPlan!.expiresAt == 'lifetime'
              ? 'lifetime'
              : `<t:${(PremiumPlan.expiresAt / 1000).toFixed()}:F>`,
        })}`,
      })
    )
  }

  owner(client: Manager, handler: CommandHandler) {
    return handler.replyV2(
      buildV2({
        color: client.color as number,
        title: `${client.i18n.get(handler.language, 'command.premium', 'profile_author')}`,
        description: `${client.i18n.get(handler.language, 'command.premium', 'profile_desc', {
          user: String(handler.user?.tag),
          plan: 'rynote@owner',
          expires: 'lifetime',
        })}`,
      })
    )
  }

  admin(client: Manager, handler: CommandHandler) {
    return handler.replyV2(
      buildV2({
        color: client.color as number,
        title: `${client.i18n.get(handler.language, 'command.premium', 'profile_author')}`,
        description: `${client.i18n.get(handler.language, 'command.premium', 'profile_desc', {
          user: String(handler.user?.tag),
          plan: 'rynote@admin',
          expires: 'lifetime',
        })}`,
      })
    )
  }
}
