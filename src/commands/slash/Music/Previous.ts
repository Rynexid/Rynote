import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkPlayer } from 'rainlink'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['previous']
  public description = 'Play the previous song again'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['prev', 'back']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []

  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer

    const previousIndex = player.queue.previous.length - 1

    if (player.queue.previous.length == 0 || previousIndex === -1)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'previous_notfound')}`,
          color: client.color,
        })
      )

    await player.previous()

    player.data.set('endMode', 'previous')

    await handler.replyV2(
      buildV2({
        description: `${client.i18n.get(handler.language, 'command.music', 'previous_msg')}`,
        color: client.color,
      })
    )
  }
}
