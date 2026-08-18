import { ApplicationCommandOptionType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { AutoReconnectBuilderService } from '../../../services/AutoReconnectBuilderService.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkLoopMode, RainlinkPlayer } from 'rainlink'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['loop']
  public description = 'Loop song in queue type all/current!'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = '<mode>'
  public aliases = ['l']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []
  public options = [
    {
      name: 'type',
      description: 'Type of loop',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: 'Song',
          value: 'song',
        },
        {
          name: 'Queue',
          value: 'queue',
        },
        {
          name: 'None',
          value: 'none',
        },
      ],
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer

    const mode = handler.args[0]

    if (!this.options[0].choices.find((e) => e.value == mode))
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'loop_invalid', {
            mode: this.changeBold(this.options[0].choices.map((e) => e.value)).join(', '),
          })}`,
          color: client.color,
        })
      )

    if ((mode == 'song' && player.loop == RainlinkLoopMode.SONG) || mode == player.loop)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'loop_already', {
            mode: mode,
          })}`,
          color: client.color,
        })
      )

    if (mode == 'song') {
      player.setLoop(RainlinkLoopMode.SONG)
      if (client.config.utilities.AUTO_RESUME)
        this.setLoop247(client, player, RainlinkLoopMode.SONG)

      await handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'loop_current')}`,
          color: client.color,
        })
      )
    } else if (mode == 'queue') {
      player.setLoop(RainlinkLoopMode.QUEUE)
      if (client.config.utilities.AUTO_RESUME)
        this.setLoop247(client, player, RainlinkLoopMode.QUEUE)

      await handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'loop_all')}`,
          color: client.color,
        })
      )
    } else if (mode === 'none') {
      player.setLoop(RainlinkLoopMode.NONE)
      if (client.config.utilities.AUTO_RESUME)
        this.setLoop247(client, player, RainlinkLoopMode.NONE)

      await handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'unloop_all')}`,
          color: client.color,
        })
      )
    }

    client.wsl.get(handler.guild!.id)?.send({
      op: 'playerLoop',
      guild: handler.guild!.id,
      mode: mode,
    })
  }

  async setLoop247(client: Manager, player: RainlinkPlayer, loop: string) {
    const data = await new AutoReconnectBuilderService(client, player).execute(player.guildId)
    if (data) {
      await client.db.autoreconnect.set(`${player.guildId}.config.loop`, loop)
    }
  }

  changeBold(arrayMode: string[]) {
    const res = []
    for (const data of arrayMode) {
      res.push(`**${data}**`)
    }
    return res
  }
}
