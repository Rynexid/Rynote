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
  public name = ['resume']
  public description = 'Resume the paused song'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['unpause']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []

  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer

    if (!player.paused)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'resume_already')}`,
          color: client.color,
        })
      )

    player.data.set('pause-from-button', true)

    const newPlayer = await player.setPause(false)

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
        description: `${client.i18n.get(handler.language, 'command.music', 'resume_msg')}`,
        color: client.color,
      })
    )
  }
}
