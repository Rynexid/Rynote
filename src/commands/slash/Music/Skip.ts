import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkPlayer } from 'rainlink'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['skip']
  public description = 'Skip the current song'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['s', 'next']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []

  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer

    if (player.queue.size == 0 && player.data.get('autoplay') !== true)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'skip_notfound')}`,
          color: client.color,
        })
      )

    await player.skip()

    await handler.replyV2(
      buildV2({
        description: `${client.i18n.get(handler.language, 'command.music', 'skip_msg')}`,
        color: client.color,
      })
    )
  }
}
