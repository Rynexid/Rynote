import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkPlayer } from 'rainlink'
import { buildV2 } from '../../../utilities/V2.js'

// Main code
export default class implements Command {
  public name = ['autoplay']
  public description = 'Autoplay music (Random play songs)'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['ap']
  public lavalink = true
  public options = []
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer

    let data: { description: string; color: any }

    if (player.data.get('autoplay') === true) {
      player.data.set('autoplay', false)
      player.data.set('identifier', null)
      player.data.set('requester', null)
      player.queue.clear()

      data = {
        description: `${client.i18n.get(handler.language, 'command.music', 'autoplay_off', {
          mode: handler.modeLang.disable,
        })}`,
        color: client.color,
      }
    } else {
      const identifier = player.queue.current?.identifier

      player.data.set('autoplay', true)
      player.data.set('identifier', identifier ?? null)
      player.data.set('requester', handler.user)
      player.data.set('source', player.queue.current?.source ?? null)
      player.data.set('author', player.queue.current?.author ?? null)
      player.data.set('title', player.queue.current?.title ?? null)

      data = {
        description: `${client.i18n.get(handler.language, 'command.music', 'autoplay_on', {
          mode: handler.modeLang.enable,
        })}`,
        color: client.color,
      }
    }

    await handler.replyV2(buildV2(data))
  }
}
