import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkLoopMode, RainlinkPlayer } from 'rainlink'
import { buildV2 } from '../../../utilities/V2.js'

const MODES: Record<string, RainlinkLoopMode> = {
  off: RainlinkLoopMode.NONE,
  none: RainlinkLoopMode.NONE,
  song: RainlinkLoopMode.SONG,
  track: RainlinkLoopMode.SONG,
  current: RainlinkLoopMode.SONG,
  queue: RainlinkLoopMode.QUEUE,
  all: RainlinkLoopMode.QUEUE,
}

export default class implements Command {
  public name = ['loop']
  public description = 'Loop the current song or the whole queue'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = '<off | song | queue>'
  public aliases = ['loopmode']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []

  public options = [
    {
      name: 'mode',
      description: 'Loop mode to set',
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: 'Off', value: 'off' },
        { name: 'Song', value: 'song' },
        { name: 'Queue', value: 'queue' },
      ],
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer

    const arg = handler.interaction
      ? (handler.interaction as ChatInputCommandInteraction).options.getString('mode')
      : handler.args[0]

    // No argument -> cycle through none -> song -> queue
    if (!arg) {
      switch (player.loop) {
        case RainlinkLoopMode.NONE:
          player.setLoop(RainlinkLoopMode.SONG)
          break
        case RainlinkLoopMode.SONG:
          player.setLoop(RainlinkLoopMode.QUEUE)
          break
        default:
          player.setLoop(RainlinkLoopMode.NONE)
          break
      }
    } else {
      const mode = MODES[arg.toLowerCase()]
      if (!mode)
        return handler.replyV2(
          buildV2({
            description: `${client.i18n.get(handler.language, 'command.music', 'loop_invalid', {
              mode: '**off/song/queue**',
            })}`,
            color: client.color,
          })
        )

      if (player.loop === mode)
        return handler.replyV2(
          buildV2({
            description: `${client.i18n.get(handler.language, 'command.music', 'loop_already', {
              mode: handler.modeLang.enable,
            })}`,
            color: client.color,
          })
        )

      player.setLoop(mode)
    }

    if (client.config.utilities.AUTO_RESUME)
      await client.db.autoreconnect
        .set(`${handler.guild!.id}.config.loop`, player.loop)
        .catch(() => null)

    const messageKey =
      player.loop === RainlinkLoopMode.SONG
        ? 'loop_current'
        : player.loop === RainlinkLoopMode.QUEUE
          ? 'loop_all'
          : 'unloop_all'

    client.wsl.get(handler.guild!.id)?.send({
      op: 'playerLoop',
      guild: handler.guild!.id,
      mode: player.loop === RainlinkLoopMode.SONG ? 'song' : player.loop,
    })

    await handler.replyV2(
      buildV2({
        description: `${client.i18n.get(handler.language, 'command.music', messageKey)}`,
        color: client.color,
      })
    )
  }
}
