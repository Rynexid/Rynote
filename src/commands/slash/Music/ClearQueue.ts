import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkPlayer } from 'rainlink'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['clearqueue']
  public description = 'Remove every song from the queue'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['clear', 'cq']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []

  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer

    if (player.queue.size == 0)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'clearqueue_nothing')}`,
          color: client.color,
        })
      )

    player.queue.clear()

    client.wsl.get(handler.guild!.id)?.send({
      op: 'playerClearQueue',
      guild: handler.guild!.id,
    })

    await handler.replyV2(
      buildV2({
        description: `${client.i18n.get(handler.language, 'command.music', 'clearqueue_msg')}`,
        color: client.color,
      })
    )
  }
}
