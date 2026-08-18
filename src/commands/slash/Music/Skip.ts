import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkPlayer } from 'rainlink'
import { buildV2 } from '../../../utilities/V2.js'

// Main code
export default class implements Command {
  public name = ['skip']
  public description = 'Skips the song currently playing.'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['s']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []
  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer

    let data: { description: string; color: any }

    if (player.queue.size == 0 && player.data.get('autoplay') !== true) {
      data = {
        description: `${client.i18n.get(handler.language, 'command.music', 'skip_notfound')}`,
        color: client.color,
      }
    } else {
      await player.skip()

      data = {
        description: `${client.i18n.get(handler.language, 'command.music', 'skip_msg')}`,
        color: client.color,
      }
    }

    await handler.replyV2(buildV2(data))
  }
}
