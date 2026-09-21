import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

const RED = 0xed4245

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
          color: RED,
          title: `${client.i18n.get(handler.language, 'error', 'no_premium_author')}`,
          description: `${client.i18n.get(handler.language, 'error', 'no_guild_premium_desc')}`,
        })
      )
    }

    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.premium', key, args)

    const expires =
      PremiumPlan.expiresAt == 'lifetime'
        ? L('premium_lifetime')
        : `<t:${(PremiumPlan.expiresAt / 1000).toFixed()}:F>`

    const iconUrl = handler.guild?.iconURL({ size: 256 })

    const container = {
      type: 17,
      accent_color: typeof client.color === 'number' ? client.color : undefined,
      components: [
        { type: 10, content: `# 💎 ${L('guild_profile_author')}` },
        ...(iconUrl
          ? [
              {
                type: 12,
                items: [{ media: { url: iconUrl }, description: handler.guild?.name }],
              },
            ]
          : []),
        { type: 14, divider: true, spacing: 1 },
        {
          type: 10,
          content:
            `- **${L('premium_field_server')}:** ${handler.guild?.name} (${handler.guild?.id})\n` +
            `- **${L('premium_field_plan')}:** \`${PremiumPlan.plan}\`\n` +
            `- **${L('premium_field_expires')}:** ${expires}`,
        },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: L('premium_get_btn'),
              url: 'https://rynote.gg/premium',
            },
          ],
        },
      ],
    }

    return handler.replyV2([container])
  }
}
