import { APIEmbedField, ApplicationCommandOptionType, User } from 'discord.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { Manager } from '../../../manager.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Premium } from '../../../database/schema/Premium.js'
import { GuildPremium } from '../../../database/schema/GuildPremium.js'
import { buildV2 } from '../../../utilities/V2.js'

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

    if (!type || !avaliableMode.includes(type))
      return handler.replyV2(
        buildV2({
          color: client.color as number,
          description: `${client.i18n.get(
            handler.language,
            'command.premium',
            'redeem_invalid_mode'
          )}`,
        })
      )

    if (!input)
      return handler.replyV2(
        buildV2({
          color: client.color as number,
          description: `${client.i18n.get(handler.language, 'command.premium', 'redeem_invalid')}`,
        })
      )

    let preData = await client.db.premium.get(`${handler.user?.id}`)
    if (type == 'guild') preData = await client.db.preGuild.get(`${handler.guild?.id}`)

    if (preData && preData.isPremium) {
      return handler.replyV2(
        buildV2({
          color: client.color as number,
          description: `${client.i18n.get(
            handler.language,
            'command.premium',
            type == 'guild' ? 'redeem_already_guild' : 'redeem_already'
          )}`,
        })
      )
    }

    const premium = await client.db.code.get(`${input.toUpperCase()}`)

    if (!premium) {
      return handler.replyV2(
        buildV2({
          color: client.color as number,
          description: `${client.i18n.get(handler.language, 'command.premium', 'redeem_invalid')}`,
        })
      )
    }

    if (premium.expiresAt !== 'lifetime' && premium.expiresAt < Date.now()) {
      return handler.replyV2(
        buildV2({
          color: client.color as number,
          description: `${client.i18n.get(handler.language, 'command.premium', 'redeem_invalid')}`,
        })
      )
    }

    const embedData = {
      color: client.color as number,
      title: `${client.i18n.get(handler.language, 'command.premium', 'redeem_title')}`,
      description: `${client.i18n.get(handler.language, 'command.premium', 'redeem_desc', {
        expires:
          premium.expiresAt !== 'lifetime'
            ? `<t:${(premium.expiresAt / 1000).toFixed()}:F>`
            : 'lifetime',
        plan: premium.plan,
      })}`,
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
      await handler.replyV2(buildV2(embedData))
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
    await handler.replyV2(buildV2(embedData))
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

    const embedField = [
      {
        name: `${client.i18n.get(language, 'event.premium', 'display_name')}`,
        value: `${premium ? handler.user?.displayName : handler.guild?.name}`,
      },
      {
        name: 'ID',
        value: `${premium ? handler.user?.id : handler.guild?.id}`,
      },
      {
        name: `${client.i18n.get(language, 'event.premium', 'createdAt')}`,
        value: ` <t:${createdAt}:F>`,
      },
      {
        name: `${client.i18n.get(language, 'event.premium', 'redeemedAt')}`,
        value: `<t:${redeemedAt}:F>`,
      },
      {
        name: `${client.i18n.get(language, 'event.premium', 'expiresAt')}`,
        value: `${expiresAt == 'lifetime' ? 'lifetime' : `<t:${(expiresAt / 1000).toFixed()}:F>`}`,
      },
      {
        name: `${client.i18n.get(language, 'event.premium', 'plan')}`,
        value: `${plan}`,
      },
    ]

    if (premium)
      embedField.unshift({
        name: `${client.i18n.get(language, 'event.premium', 'username')}`,
        value: `${handler.user?.username}`,
      })

    try {
      const channel = await client.channels
        .fetch(client.config.utilities.PREMIUM_LOG_CHANNEL)
        .catch(() => undefined)
      if (!channel || (channel && !channel.isTextBased())) return
      await channel.send({
        flags: 32768,
        components: buildV2({
          color: client.color as number,
          title: `${client.i18n.get(language, 'event.premium', premium ? 'title' : 'guild_title')}`,
          fields: embedField,
        }),
      })
    } catch {}

    return
  }
}
