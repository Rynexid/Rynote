import { GuildBasedChannel, PermissionFlagsBits, TextChannel } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['announcement']
  public description = 'Send announcement mesage to all server'
  public category = 'Dev'
  public accessableby = [Accessableby.Dev]
  public usage = '<your_message>'
  public aliases = ['an']
  public lavalink = false
  public usingInteraction = false
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    if (!handler.args[0] || !handler.message)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: client.i18n.get(handler.language, 'command.owner', 'ann_empty'),
          color: client.color,
        }),
      } as any)

    const avalibleChannel: GuildBasedChannel[] = []
    const allGuild = client.guilds.cache.map((guild) => guild)
    let sentSuccesfully = 0

    for (const guild of allGuild) {
      const channelFilterTextBased = guild.channels.cache.filter((channel) => channel.isTextBased())
      const channelFilterPermission = channelFilterTextBased.filter((channel) =>
        channel.guild.members.me?.permissions.has(PermissionFlagsBits.SendMessages)
      )
      const channelFilterGeneral = channelFilterPermission.filter((channel) =>
        channel.name.includes('general')
      )
      const channelFilterNonGeneral = channelFilterPermission.filter(
        (channel) => !channel.name.includes('general')
      )
      if (channelFilterGeneral.size !== 0) {
        avalibleChannel.push(channelFilterGeneral.first()!)
      } else {
        avalibleChannel.push(channelFilterNonGeneral.first()!)
      }
    }

    const parsed = handler.message.content.replace(handler.prefix, '').split(' ')
    const block = this.parse(parsed.slice(1).join(' '))

    for (const channel of avalibleChannel) {
      sentSuccesfully = sentSuccesfully + 1
      const announcement = buildV2({
        title: client.i18n.get(handler.language, 'command.owner', 'ann_title'),
        description: block !== null ? block[2] : parsed.slice(1).join(' ')!,
        color: client.color,
        footer: `${handler.guild!.members.me!.displayName}`,
      })
      await (channel as TextChannel)
        .send({ flags: 32768, components: announcement } as any)
        .catch(() => (sentSuccesfully = sentSuccesfully - 1))
    }

    const result = buildV2({
      description:
        `${client.i18n.get(handler.language, 'command.owner', 'ann_success', {
          count: String(sentSuccesfully),
        })}\n` +
        `${client.i18n.get(handler.language, 'command.owner', 'ann_failed', {
          count: String(avalibleChannel.length - sentSuccesfully),
        })}`,
      color: client.color,
      footer: `${handler.guild!.members.me!.displayName}`,
    })

    await handler.editReply({ flags: 32768, components: result } as any)
  }

  protected parse(content: string): string[] | null {
    // @ts-ignore
    const result = content.match(/^```(.*?)\n(.*?)```$/ms)
    return result ? result.slice(0, 3).map((el) => el.trim()) : null
  }
}
