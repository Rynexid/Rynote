import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildBasedChannel,
  MessageFlags,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

type TargetPreference = 'general' | 'announcement' | 'changelog'

const TARGETS: TargetPreference[] = ['general', 'announcement', 'changelog']

interface AnnouncePayload {
  title: string
  description: string
  color?: string
  image?: string
  footer?: string
  target: TargetPreference
}

export default class implements Command {
  public name = ['announcement']
  public description = 'Send announcement message to all public servers'
  public category = 'Dev'
  public accessableby = [Accessableby.Dev]
  public usage =
    '<description> [--title <text>] [--color <hex>] [--image <url>] [--footer <text>] [--target <general|announcement|changelog>]'
  public aliases = ['an']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'description',
      description: 'The announcement body (markdown supported)',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'title',
      description: 'Title shown on top of the announcement',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'color',
      description: 'Accent color in hex, e.g. #5865F2',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'image',
      description: 'Image URL attached to the announcement',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'footer',
      description: 'Footer text',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'target',
      description: 'Which channel the bot should look for',
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: 'General', value: 'general' },
        { name: 'Announcement', value: 'announcement' },
        { name: 'Changelog', value: 'changelog' },
      ],
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.owner', key, args)

    const payload = handler.interaction
      ? this.parseInteraction(handler.interaction as ChatInputCommandInteraction)
      : this.parsePrefix(handler)

    if (!payload)
      return handler.editReply({
        flags: 32768,
        components: buildV2({ description: L('ann_empty'), color: client.color }),
      } as any)

    if (payload.color && !/^#?[0-9a-fA-F]{6}$/.test(payload.color))
      return handler.editReply({
        flags: 32768,
        components: buildV2({ description: L('ann_invalid_color'), color: client.color }),
      } as any)

    const result = await this.broadcast(client, handler, payload)

    return handler.editReply({
      flags: 32768,
      components: buildV2({
        title: L('ann_done_title'),
        description:
          `${result.forGuilds}\n` +
          `${L('ann_success', { count: String(result.sent) })}\n` +
          `${L('ann_failed', { count: String(result.failed) })}`,
        color: client.color,
        footer: handler.guild!.members.me!.displayName,
      }),
    } as any)
  }

  protected parseInteraction(interaction: ChatInputCommandInteraction): AnnouncePayload | null {
    const description = interaction.options.getString('description')?.trim()
    if (!description) return null

    const target = (interaction.options.getString('target') ?? 'general').toLowerCase()

    return {
      description,
      title: interaction.options.getString('title')?.trim() || '',
      color: interaction.options.getString('color')?.trim(),
      image: interaction.options.getString('image')?.trim(),
      footer: interaction.options.getString('footer')?.trim(),
      target: (TARGETS.includes(target as TargetPreference)
        ? target
        : 'general') as TargetPreference,
    }
  }

  protected parsePrefix(handler: CommandHandler): AnnouncePayload | null {
    if (!handler.message) return null

    const parsed = handler.message.content.replace(handler.prefix, '').split(' ').slice(1)

    const flags: Record<string, string> = {}
    const body: string[] = []

    for (let i = 0; i < parsed.length; i++) {
      const token = parsed[i]
      if (token.startsWith('--')) {
        const key = token.slice(2).toLowerCase()
        const next = parsed[i + 1]
        if (next && !next.startsWith('--')) {
          flags[key] = next
          i++
        } else {
          flags[key] = 'true'
        }
      } else {
        body.push(token)
      }
    }

    const description = body.join(' ').trim()
    if (!description) return null

    const target = (flags.target ?? 'general').toLowerCase()

    return {
      description,
      title: flags.title ?? '',
      color: flags.color,
      image: flags.img ?? flags.image,
      footer: flags.footer,
      target: (TARGETS.includes(target as TargetPreference)
        ? target
        : 'general') as TargetPreference,
    }
  }

  protected pickChannel(
    guild: { channels: { cache: Map<string, GuildBasedChannel> } },
    preference: TargetPreference
  ): TextChannel | undefined {
    const textChannels = [...guild.channels.cache.values()].filter(
      (channel) =>
        channel.isTextBased() &&
        (channel as TextChannel).guild.members.me?.permissions.has(PermissionFlagsBits.SendMessages)
    ) as TextChannel[]

    if (!textChannels.length) return undefined

    const nameMatch = (channel: TextChannel) => channel.name.toLowerCase().includes(preference)

    const parentMatch = (channel: TextChannel) =>
      channel.parent?.name.toLowerCase().includes(preference) ?? false

    return (
      textChannels.find(parentMatch) ??
      textChannels.find(nameMatch) ??
      textChannels.find((c) => c.name.toLowerCase().includes('general')) ??
      textChannels[0]
    )
  }

  protected async broadcast(client: Manager, handler: CommandHandler, payload: AnnouncePayload) {
    const avalibleChannel: TextChannel[] = []

    for (const guild of client.guilds.cache.values()) {
      const channel = this.pickChannel(guild, payload.target)
      if (channel) avalibleChannel.push(channel)
    }

    let sentSuccesfully = 0

    const announcement = buildV2({
      title: payload.title || client.i18n.get(handler.language, 'command.owner', 'ann_title'),
      description: payload.description,
      color: (payload.color ?? client.color) as any,
      image: payload.image,
      footer: payload.footer ?? `${handler.guild!.members.me!.displayName}`,
    })

    for (const channel of avalibleChannel) {
      await (channel as TextChannel)
        .send({ flags: MessageFlags.IsComponentsV2, components: announcement } as any)
        .then(() => sentSuccesfully++)
        .catch(() => null)
    }

    return {
      forGuilds: `${avalibleChannel.length}`,
      sent: sentSuccesfully,
      failed: avalibleChannel.length - sentSuccesfully,
    }
  }
}
