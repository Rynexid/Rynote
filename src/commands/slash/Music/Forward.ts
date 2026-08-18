import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkPlayer } from 'rainlink'
import { formatDuration } from '../../../utilities/FormatDuration.js'
import { buildV2 } from '../../../utilities/V2.js'
const fastForwardNum = 10

// Main code
export default class implements Command {
  public name = ['forward']
  public description = 'Forward timestamp in the song! (10s)'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['f']
  public lavalink = true
  public options = []
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer

    const song = player.queue.current
    const song_position = player.position
    const CurrentDuration = formatDuration(song_position + fastForwardNum * 1000)

    let data: { description: string; color: any }

    if (song_position + fastForwardNum * 1000 < song!.duration!) {
      player.send({
        guildId: handler.guild!.id,
        playerOptions: {
          position: song_position + fastForwardNum * 1000,
        },
      })

      data = {
        description: `${client.i18n.get(handler.language, 'command.music', 'forward_msg', {
          duration: CurrentDuration,
        })}`,
        color: client.color,
      }
    } else {
      data = {
        description: `${client.i18n.get(handler.language, 'command.music', 'forward_beyond')}`,
        color: client.color,
      }
    }

    await handler.replyV2(buildV2(data))
  }
}
