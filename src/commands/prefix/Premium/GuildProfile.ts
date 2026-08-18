import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['pmgprofile']
  public description = 'View your guild premium profile!'
  public category = 'Premium'
  public accessableby = [Accessableby.GuildPremium]
  public usage = ''
  public aliases = ['pmgp', 'guild']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    const PremiumPlan = await client.db.preGuild.get(`${handler.guild?.id}`)

    if (!PremiumPlan) {
      return handler.replyV2(
        buildV2({
          color: client.color as number,
          title: `${client.i18n.get(handler.language, 'error', 'no_premium_author')}`,
          description: `${client.i18n.get(handler.language, 'error', 'no_guild_premium_desc')}`,
        })
      )
    }

    return handler.replyV2(
      buildV2({
        color: client.color as number,
        title: `${client.i18n.get(handler.language, 'command.premium', 'guild_profile_author')}`,
        description: `${client.i18n.get(handler.language, 'command.premium', 'guild_profile_desc', {
          guild: String(handler.guild?.name),
          plan: PremiumPlan!.plan,
          expires:
            PremiumPlan!.expiresAt == 'lifetime'
              ? 'lifetime'
              : `<t:${(PremiumPlan.expiresAt / 1000).toFixed()}:F>`,
        })}`,
      })
    )
  }
}
