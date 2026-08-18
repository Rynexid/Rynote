import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['ping']
  public description = 'Shows the ping information of the Bot'
  public category = 'Info'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = []
  public lavalink = false
  public options = []
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []

  public async execute(client: Manager, handler: CommandHandler) {
    const data = {
      title: `${client.i18n.get(handler.language, 'command.info', 'ping_title')}${client.user!.username}`,
      description: `${client.i18n.get(handler.language, 'command.info', 'ping_desc', {
        ping: String(client.ws.ping),
        response: String(Date.now() - handler.createdAt),
      })}`,
      color: client.color as number,
    }

    await handler.replyV2(buildV2(data))
  }
}
