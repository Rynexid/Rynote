import { ApplicationCommandOptionType, Guild, PermissionFlagsBits } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['serverinvite']
  public description = 'Generate an invite link to a specific server!'
  public category = 'Owner'
  public accessableby = [Accessableby.Owner]
  public usage = '<id>'
  public aliases = ['srv']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'id',
      description: 'The ID of the server you want an invite to',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.owner', key, args)

    const id = handler.args[0] ?? handler.guild?.id
    const guild = id ? client.guilds.cache.get(id) : undefined

    if (!guild)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: L('srv_notfound'),
          color: client.color,
        }),
      } as any)

    const invite = await this.getInvite(guild)

    if (!invite)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: L('srv_nochannel'),
          color: client.color,
        }),
      } as any)

    await handler.editReply({
      flags: 32768,
      components: buildV2({
        title: guild.name,
        description: L('srv_link', { name: guild.name }),
        footer: `${L('srv_join')} • ${guild.memberCount} members`,
        color: client.color,
        buttons: [[{ label: L('srv_join'), url: invite, style: 5 }]],
      }),
    } as any)
  }

  protected async getInvite(guild: Guild) {
    const me = guild.members.me
    if (!me) return undefined
    const channel = guild.channels.cache
      .filter(
        (c) =>
          c.isTextBased() &&
          c
            .permissionsFor(me)
            ?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.CreateInstantInvite])
      )
      .first() as import('discord.js').TextChannel | undefined
    if (!channel) return undefined
    return channel
      .createInvite({ maxAge: 86400, maxUses: 0, reason: 'Rynote server invite' })
      .then((invite) => `https://discord.gg/${invite.code}`)
      .catch(() => undefined)
  }
}
