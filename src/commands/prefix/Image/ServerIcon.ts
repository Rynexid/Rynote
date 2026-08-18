import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['servericon']
  public description = "Show this server's icon"
  public category = 'Image'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['gicon']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()
    const guild = handler.guild
    if (!guild)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          color: client.color,
          description: `${client.i18n.get(handler.language, 'error', 'no_guild')}`,
        }),
      } as any)

    const url = guild.iconURL({ size: 512 })
    if (!url)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          color: client.color,
          description: `${client.i18n.get(handler.language, 'error', 'no_icon', {
            guild: guild.name,
          })}`,
        }),
      } as any)

    const components = buildV2({
      color: client.color,
      title: client.i18n.get(handler.language, 'command.image', 'servericon_title', {
        guild: guild.name,
      }),
      image: url,
    })
    await handler.editReply({ flags: 32768, components } as any)
  }
}
