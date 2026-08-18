import { Message } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['shutdown']
  public description = 'Shuts down the client!'
  public category = 'Owner'
  public accessableby = [Accessableby.Owner]
  public usage = ''
  public aliases = ['shutdown']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []

  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    await handler.editReply({
      flags: 32768,
      components: buildV2({
        description: `${client.i18n.get(handler.language, 'command.utils', 'restart_msg')}`,
        color: client.color,
        footer: `${handler.guild!.members.me!.displayName}`,
      }),
    } as any)

    process.exit()
  }
}
