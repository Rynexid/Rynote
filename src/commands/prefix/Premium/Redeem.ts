import { ApplicationCommandOptionType } from 'discord.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { Manager } from '../../../manager.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Premium } from '../../../database/schema/Premium.js'
import { GuildPremium } from '../../../database/schema/GuildPremium.js'
import { buildV2 } from '../../../utilities/V2.js'

const GREEN = 0x57f287
const YELLOW = 0xfee75c
const RED = 0xed4245

export default class implements Command {
  public name = ['pmredeem']
  public description = 'Redeem your premium!'
  public category = 'Premium'
  public accessableby = [Accessableby.Member]
  public usage = '<type> <input>'
  public aliases = ['redeem']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'type',
      description: 'Which type you want to redeem?',
      required: true,
      type: ApplicationCommandOptionType.String,
      choices: [
        {
          name: 'User',
          value: 'user',
        },
        {
          name: 'Guild',
          value: 'guild',
        },
      ],
    },
    {
      name: 'code',
      description: 'The code you want to redeem',
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    const avaliableMode = this.options[0].choices!.map((data) => data.value)
    const type = handler.args[0]
    const input = handler.args[1]
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.premium', key, args)

    if (!type || !avaliableMode.includes(type))
      return handler.replyV2(
        buildV2({
          color: RED,
          description: L('redeem_invalid_mode'),
        })
      )

    if (!input)
      return handler.replyV2(
        buildV2({
          color: RED,
          description: L('redeem_invalid'),
        })
      )

    let preData = await client.db.premium.get(`${handler.user?.id}`)
    if (type == 'guild') preData = await client.db.preGuild.get(`${handler.guild?.id}`)

    if (preData && preData.isPremium) {
      return handler.replyV2(
        buildV2({
          color: YELLOW,
          description: L(type == 'guild' ? 'redeem_already_guild' : 'redeem_already'),
        })
      )
    }

    const premium = await client.db.code.get(`${input.toUpperCase()}`)

    if (!premium) {
      return handler.replyV2(
        buildV2({
          color: RED,
          description: L('redeem_invalid'),
        })
      )
    }

    if (premium.expiresAt !== 'lifetime' && premium.expiresAt < Date.now()) {
      return handler.replyV2(
        buildV2({
          color: RED,
          description: L('redeem_invalid'),
        })
      )
    }

    const expires =
      premium.expiresAt !== 'lifetime'
        ? `<t:${(premium.expiresAt / 1000).toFixed()}:F>`
        : L('premium_lifetime')

    const mediaUrl =
      type == 'guild'
        ? handler.guild?.iconURL({ size: 256 })
        : handler.user?.displayAvatarURL({ size: 256 })

    const success =
      type == 'guild'
        ? L('redeem_success_guild', { guild: String(handler.guild?.name) })
        : L('redeem_success_user', { user: String(handler.user?.id) })

    const receipt = {
      type: 17,
      accent_color: typeof client.color === 'number' ? client.color : undefined,
      components: [
        { type: 10, content: `# 💎 ${L('redeem_title')}` },
        ...(mediaUrl
          ? [
              {
                type: 12,
                items: [
                  {
                    media: { url: mediaUrl },
                    description: type == 'guild' ? handler.guild?.name : handler.user?.username,
                  },
                ],
              },
            ]
          : []),
        { type: 14, divider: true, spacing: 1 },
        {
          type: 10,
          content:
            `> ${success}\n\n` +
            (type == 'guild'
              ? `- **${L('premium_field_server')}:** ${handler.guild?.name} (${handler.guild?.id})\n`
              : `- **${L('premium_field_user')}:** <@${handler.user?.id}>\n`) +
            `- **${L('premium_field_plan')}:** \`${premium.plan}\`\n` +
            `- **${L('premium_field_expires')}:** ${expires}\n\n` +
            `-# ${L('premium_field_redeemed_at')} <t:${Math.floor(Date.now() / 1000)}:R>`,
        },
      ],
    }

    await client.db.code.delete(`${input.toUpperCase()}`)

    if (type == 'guild') {
      const newPreGuild = await client.db.preGuild.set(`${handler.guild?.id}`, {
        id: String(handler.guild?.id),
        isPremium: true,
        redeemedBy: {
          id: String(handler.guild?.id),
          name: String(handler.guild?.name),
          createdAt: Number(handler.guild?.createdAt.getTime()),
          ownerId: String(handler.guild?.ownerId),
        },
        redeemedAt: Date.now(),
        expiresAt: premium.expiresAt,
        plan: premium.plan,
      })
      await handler.replyV2([receipt])
      await this.sendRedeemLog(client, handler, null, newPreGuild)
      return
    }
    const newPreUser = await client.db.premium.set(`${handler.user?.id}`, {
      id: String(handler.user?.id),
      isPremium: true,
      redeemedBy: {
        id: String(handler.user?.id),
        username: String(handler.user?.username),
        displayName: String(handler.user?.displayName),
        avatarURL: handler.user?.avatarURL() ?? null,
        createdAt: Number(handler.user?.createdAt.getTime()),
        mention: `<@${handler.user?.id}>`,
      },
      redeemedAt: Date.now(),
      expiresAt: premium.expiresAt,
      plan: premium.plan,
    })
    await handler.replyV2([receipt])
    await this.sendRedeemLog(client, handler, newPreUser, null)
    return
  }

  protected async sendRedeemLog(
    client: Manager,
    handler: CommandHandler,
    premium: Premium | null,
    guildPremium: GuildPremium | null
  ): Promise<void> {
    if (!client.config.utilities.PREMIUM_LOG_CHANNEL) return
    const language = client.config.bot.LANGUAGE

    const createdAt = (
      (premium ? handler.user?.createdAt.getTime() : handler.guild?.createdAt.getTime()) / 1000
    ).toFixed()
    const redeemedAt = (
      (premium ? premium.redeemedAt : guildPremium ? guildPremium.redeemedAt : 0) / 1000
    ).toFixed()
    const expiresAt = premium ? premium.expiresAt : guildPremium ? guildPremium.expiresAt : 0
    const plan = premium ? premium.plan : guildPremium ? guildPremium.plan : 'rynote@error'

    const expires = expiresAt == 'lifetime' ? 'lifetime' : `<t:${(expiresAt / 1000).toFixed()}:F>`

    const mediaUrl = premium
      ? handler.user?.displayAvatarURL({ size: 256 })
      : handler.guild?.iconURL({ size: 256 })

    const fields = [
      ...(premium
        ? [
            {
              name: `${client.i18n.get(language, 'event.premium', 'username')}`,
              value: `${handler.user?.username}`,
            },
          ]
        : []),
      {
        name: `${client.i18n.get(language, 'event.premium', 'display_name')}`,
        value: `${premium ? handler.user?.displayName : handler.guild?.name}`,
      },
      { name: 'ID', value: `${premium ? handler.user?.id : handler.guild?.id}` },
      {
        name: `${client.i18n.get(language, 'event.premium', 'createdAt')}`,
        value: ` <t:${createdAt}:F>`,
      },
      {
        name: `${client.i18n.get(language, 'event.premium', 'redeemedAt')}`,
        value: `<t:${redeemedAt}:F>`,
      },
      { name: `${client.i18n.get(language, 'event.premium', 'expiresAt')}`, value: `${expires}` },
      { name: `${client.i18n.get(language, 'event.premium', 'plan')}`, value: `${plan}` },
    ]

    const logContainer = {
      type: 17,
      accent_color: typeof client.color === 'number' ? client.color : undefined,
      components: [
        {
          type: 10,
          content: `# 💎 ${client.i18n.get(language, 'event.premium', premium ? 'title' : 'guild_title')}`,
        },
        ...(mediaUrl
          ? [
              {
                type: 12,
                items: [
                  {
                    media: { url: mediaUrl },
                    description: premium ? handler.user?.username : handler.guild?.name,
                  },
                ],
              },
            ]
          : []),
        { type: 14, divider: true, spacing: 1 },
        {
          type: 10,
          content: fields.map((f) => `- **${f.name}:** ${f.value}`).join('\n'),
        },
      ],
    }

    try {
      const channel = await client.channels
        .fetch(client.config.utilities.PREMIUM_LOG_CHANNEL)
        .catch(() => undefined)
      if (!channel || (channel && !channel.isTextBased())) return
      await channel.send({
        flags: 32768,
        components: [logContainer],
      })
    } catch {}

    return
  }
}
