import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'
import { ExtendedPlayer } from '../../../structures/extended/ExtendedPlayer.js'

export default class implements Command {
  public name = ['stop']
  public description = 'Stop the player and clear the queue'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['st', 'disconnect', 'dc']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []

  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(handler.guild!.id) as ExtendedPlayer

    player.data.set('sudo-destroy', true)

    const is247 = await client.db.autoreconnect.get(`${handler.guild!.id}`)
    await player.stop(is247 && is247.twentyfourseven ? false : true)

    await handler.replyV2(
      buildV2({
        description: `${client.i18n.get(handler.language, 'command.music', 'stop_msg')}`,
        color: client.color,
      })
    )
  }
}
