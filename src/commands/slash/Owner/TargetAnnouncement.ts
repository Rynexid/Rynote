import { Guild, PermissionFlagsBits, TextChannel } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['targetannouncement']
  public description = 'Send announcement to a specific server or its owner'
  public category = 'Dev'
  public accessableby = [Accessableby.Dev]
  public usage = '<guildId | here> [--owner] <your_message>'
  public aliases = ['ta']
  public lavalink = false
  public usingInteraction = false
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.owner', key, args)

    if (!handler.message) return

    const parsed = handler.message.content.replace(handler.prefix, '').split(' ').slice(1)
    const toOwner = parsed.includes('--owner')
    const args = parsed.filter((el) => !el.startsWith('--'))
    const target = args[0]

    if (!target)
      return handler.editReply({
        flags: 32768,
        components: buildV2({ description: L('ta_empty'), color: client.color }),
      } as any)

    let guild: Guild | undefined
    if (target === 'here') {
      guild = handler.guild ?? undefined
    } else {
      guild = client.guilds.cache.get(target.replace(/[^0-9]/g, ''))
    }

    if (!guild)
      return handler.editReply({
        flags: 32768,
        components: buildV2({ description: L('ta_notfound'), color: client.color }),
      } as any)

    const block = this.parse(args.slice(1).join(' '))
    const content = block !== null ? block[2] : args.slice(1).join(' ')

    if (!content)
      return handler.editReply({
        flags: 32768,
        components: buildV2({ description: L('ta_empty'), color: client.color }),
      } as any)

    const announcement = buildV2({
      title: L('ann_title'),
      description: content,
      color: client.color,
      footer: `${handler.guild!.members.me!.displayName}`,
    })

    if (toOwner) {
      const owner = await guild.fetchOwner().catch(() => undefined)
      if (!owner)
        return handler.editReply({
          flags: 32768,
          components: buildV2({ description: L('ta_nodm'), color: client.color }),
        } as any)
      await owner
        .send({ flags: 32768, components: announcement } as any)
        .then(() =>
          handler.editReply({
            flags: 32768,
            components: buildV2({
              description: L('ta_sent_owner', { name: guild!.name }),
              color: client.color,
            }),
          } as any)
        )
        .catch(() =>
          handler.editReply({
            flags: 32768,
            components: buildV2({ description: L('ta_nodm'), color: client.color }),
          } as any)
        )
      return
    }

    const available = guild.channels.cache
      .filter((channel) => channel.isTextBased())
      .filter((channel) =>
        channel.guild.members.me?.permissions.has(PermissionFlagsBits.SendMessages)
      )
      .sort((a, b) => Number(a.name.includes('general')) - Number(b.name.includes('general')))
      .first() as TextChannel | undefined

    if (!available)
      return handler.editReply({
        flags: 32768,
        components: buildV2({ description: L('ta_nochannel'), color: client.color }),
      } as any)

    await available
      .send({ flags: 32768, components: announcement } as any)
      .then(() =>
        handler.editReply({
          flags: 32768,
          components: buildV2({
            description: L('ta_sent_channel', { name: guild!.name }),
            color: client.color,
          }),
        } as any)
      )
      .catch(() =>
        handler.editReply({
          flags: 32768,
          components: buildV2({ description: L('ta_nochannel'), color: client.color }),
        } as any)
      )
  }

  protected parse(content: string): string[] | null {
    // @ts-ignore
    const result = content.match(/^```(.*?)\n(.*?)```$/ms)
    return result ? result.slice(0, 3).map((el) => el.trim()) : null
  }
}
