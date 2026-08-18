import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkPlayer } from 'rainlink'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['pause']
  public description = 'Pause the music!'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['ps']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []
  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer

    await player.pause()

    const embed = {
      description: `${client.i18n.get(handler.language, 'command.music', 'pause_msg')}`,
      color: client.color,
    }

    handler.replyV2(buildV2(embed))
  }
}
