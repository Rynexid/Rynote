import {
  ActionRowBuilder,
  ComponentType,
  GuildBasedChannel,
  MessageFlags,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
} from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

const SELECT_ID = 'announcement_target'
const COLLECTOR_TIME = 60_000

const CHANGELOG =
  '## 💫 Rynote v1.0.1\n' +
  '\n' +
  '### 🛠 Fixed\n' +
  '- Source picker now renders real line breaks for YouTube/Spotify results\n' +
  '- Now-playing message no longer errors when a track has no artwork\n' +
  '\n' +
  '### ✨ Changed\n' +
  '- Moved the `config` command from Profile to Utils\n' +
  '- Removed legacy events and deprecated Filter/Music commands\n' +
  '\n' +
  '### 🆕 Added\n' +
  '- Full playlist command set (`playlist add`, `create`, `editor`, `import`, ...)\n' +
  '- Registered `EmojiMap` utility\n' +
  '- Generated `commands.json` manifest for reliable slash deploy'

type TargetPreference = 'general' | 'announcement' | 'changelog'

export default class implements Command {
  public name = ['announcement']
  public description = 'Send announcement message to all public servers'
  public category = 'Dev'
  public accessableby = [Accessableby.Dev]
  public usage = ''
  public aliases = ['an']
  public lavalink = false
  public usingInteraction = false
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.owner', key, args)

    const select = new StringSelectMenuBuilder()
      .setCustomId(SELECT_ID)
      .setPlaceholder(L('ann_choose_placeholder'))
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(L('ann_opt_general'))
          .setDescription(L('ann_opt_general_desc'))
          .setValue('general'),
        new StringSelectMenuOptionBuilder()
          .setLabel(L('ann_opt_announcement'))
          .setDescription(L('ann_opt_announcement_desc'))
          .setValue('announcement'),
        new StringSelectMenuOptionBuilder()
          .setLabel(L('ann_opt_changelog'))
          .setDescription(L('ann_opt_changelog_desc'))
          .setValue('changelog')
      )
    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)

    const container = {
      type: 17,
      accent_color: typeof client.color === 'number' ? client.color : undefined,
      components: [
        { type: 10, content: `# ${L('ann_choose_title')}` },
        { type: 10, content: L('ann_choose_desc') },
        selectRow.toJSON(),
      ],
    }

    const msg = (await handler.replyV2([container])) as any

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: COLLECTOR_TIME,
      filter: (i: any) => i.user.id === handler.user?.id,
    })

    collector.on('collect', async (i: any) => {
      if (i.customId !== SELECT_ID) return
      await i.deferUpdate().catch(() => null)

      const preference = (i.values[0] ?? 'general') as TargetPreference
      const result = await this.broadcast(client, handler, CHANGELOG, preference)

      await msg
        .edit({
          flags: MessageFlags.IsComponentsV2,
          components: buildV2({
            title: L('ann_title'),
            description:
              `${result.forGuilds}\n` +
              `${L('ann_success', { count: String(result.sent) })}` +
              `\n${L('ann_failed', { count: String(result.failed) })}`,
            color: client.color,
            footer: handler.guild!.members.me!.displayName,
          }),
        } as any)
        .catch(() => null)
    })

    collector.on('end', (_collected: any, reason: string) => {
      if (reason === 'time') {
        msg
          .edit({
            flags: MessageFlags.IsComponentsV2,
            components: buildV2({
              description: L('ann_cancel'),
              color: client.color,
            }),
          } as any)
          .catch(() => undefined)
      }
    })
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

  protected async broadcast(
    client: Manager,
    handler: CommandHandler,
    content: string,
    preference: TargetPreference
  ) {
    const avalibleChannel: TextChannel[] = []

    for (const guild of client.guilds.cache.values()) {
      const channel = this.pickChannel(guild, preference)
      if (channel) avalibleChannel.push(channel)
    }

    let sentSuccesfully = 0

    const announcement = buildV2({
      title: client.i18n.get(handler.language, 'command.owner', 'ann_title'),
      description: content,
      color: client.color,
      footer: `${handler.guild!.members.me!.displayName}`,
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
