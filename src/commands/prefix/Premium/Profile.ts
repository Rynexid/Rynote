import { ApplicationCommandOptionType, User } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler, ParseMentionEnum } from '../../../structures/CommandHandler.js'
import { Premium } from '../../../database/schema/Premium.js'
import { buildV2 } from '../../../utilities/V2.js'

const RED = 0xed4245

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

    if (user?.id == client.owner)
      return this.card(client, handler, user, {
        plan: 'rynote@owner',
        expires: 'lifetime',
        status: client.i18n.get(handler.language, 'command.premium', 'premium_status_owner'),
        badge: '👑',
      })
    if (client.config.bot.ADMIN.includes(user?.id ?? 'null'))
      return this.card(client, handler, user, {
        plan: 'rynote@admin',
        expires: 'lifetime',
        status: client.i18n.get(handler.language, 'command.premium', 'premium_status_admin'),
        badge: '🛡️',
      })

    const PremiumPlan = (await client.db.premium.get(`${user?.id}`)) as Premium

    if (!PremiumPlan) {
      return handler.replyV2(
        buildV2({
          color: RED,
          title: `${client.i18n.get(handler.language, 'command.premium', 'profile_author')}`,
          description: `${client.i18n.get(
            handler.language,
            'command.premium',
            'profile_error_desc',
            {
              user: String(user?.username),
            }
          )}`,
        })
      )
    }

    return this.card(client, handler, user, {
      plan: PremiumPlan.plan,
      expires: PremiumPlan.expiresAt,
      status: client.i18n.get(handler.language, 'command.premium', 'premium_active'),
      badge: '💎',
    })
  }

  private card(
    client: Manager,
    handler: CommandHandler,
    user: User | undefined,
    data: { plan: string; expires: number | 'lifetime'; status: string; badge: string }
  ) {
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.premium', key, args)

    const expires =
      data.expires === 'lifetime'
        ? L('premium_lifetime')
        : `<t:${(data.expires / 1000).toFixed()}:F>`

    const avatarUrl = user?.displayAvatarURL({ size: 256 })

    const container = {
      type: 17,
      accent_color: typeof client.color === 'number' ? client.color : undefined,
      components: [
        { type: 10, content: `# ${data.badge} ${L('profile_author')}` },
        ...(avatarUrl
          ? [
              {
                type: 12,
                items: [{ media: { url: avatarUrl }, description: user?.username }],
              },
            ]
          : []),
        { type: 14, divider: true, spacing: 1 },
        {
          type: 10,
          content:
            `- **${L('premium_field_user')}:** <@${user?.id}> (${user?.tag})\n` +
            `- **${L('premium_field_plan')}:** \`${data.plan}\`\n` +
            `- **${L('premium_field_expires')}:** ${expires}\n` +
            `- **${L('premium_field_status')}:** ${data.badge} ${data.status}`,
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
