import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkPlayer } from 'rainlink'
import {
  filterSelect,
  playerRowOne,
  playerRowOneEdited,
  playerRowTwo,
} from '../../../utilities/PlayerControlButton.js'
import { buildV2 } from '../../../utilities/V2.js'
import { MessageFlags } from 'discord.js'

export default class implements Command {
  public name = ['pause']
  public description = 'Pause the current song'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['break']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []

  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer

    player.data.set('pause-from-button', true)

    const newPlayer = await player.setPause(!player.paused)

    const nplaying = client.nplayingMsg.get(player.guildId)
    if (nplaying && !nplaying.msg.flags.has(MessageFlags.IsComponentsV2))
      nplaying.msg
        .edit({
          components: [
            filterSelect(client, false, handler.language),
            newPlayer.paused ? playerRowOneEdited(client, false) : playerRowOne(client, false),
            playerRowTwo(client, false),
          ],
        })
        .catch(() => null)

    await handler.replyV2(
      buildV2({
        description: `${client.i18n.get(
          handler.language,
          'command.music',
          newPlayer.paused ? 'pause_msg' : 'resume_msg'
        )}`,
        color: client.color,
      })
    )
  }
}
