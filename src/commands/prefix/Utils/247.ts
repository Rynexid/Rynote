import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js'
import { Manager } from '../../../manager.js'
import { AutoReconnectBuilderService } from '../../../services/AutoReconnectBuilderService.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkPlayer } from 'rainlink'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['247']
  public description = '24/7 in voice channel'
  public category = 'Utils'
  public accessableby = [Accessableby.Manager]
  public usage = '<true/false>'
  public aliases = ['24/7', '247']
  public lavalink = true
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []

  public options = [
    {
      name: 'mode',
      description: 'Turn 24/7 mode on or off',
      required: true,
      type: ApplicationCommandOptionType.Boolean,
    },
  ]
  public playerCheck = false

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    let player = client.rainlink.players.get(handler.guild!.id) as RainlinkPlayer | undefined
    const reconnectBuilder = new AutoReconnectBuilderService(client, player)

    let mode: boolean | null = null

    if (handler.interaction) {
      mode = (handler.interaction as ChatInputCommandInteraction).options.getBoolean('mode')
    } else {
      const arg = handler.args[0]?.toLowerCase()
      if (['on', 'true', '1', 'yes'].includes(arg)) mode = true
      else if (['off', 'false', '0', 'no'].includes(arg)) mode = false
    }

    if (mode == null)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.utils', '247_invalid')}`,
          color: client.color,
        })
      )

    const data = await reconnectBuilder.execute(handler.guild!.id)

    if (data.twentyfourseven === mode)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.utils', '247_already', {
            mode: mode ? handler.modeLang.enable : handler.modeLang.disable,
          })}`,
          color: client.color,
        })
      )

    if (!mode) {
      data.current || data.current.length !== 0
        ? await client.db.autoreconnect.set(`${handler.guild!.id}.twentyfourseven`, false)
        : await client.db.autoreconnect.delete(`${handler.guild!.id}`)

      player ? player.data.set('sudo-destroy', true) : true
      player && player.voiceId && handler.member!.voice.channel == null ? player.destroy() : true

      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.utils', '247_off')}`,
          color: client.color,
        })
      )
    }

    const { channel } = handler.member!.voice
    if (!channel || handler.member!.voice.channel == null)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'error', 'no_in_voice')}`,
          color: client.color,
        })
      )

    if (!player)
      player = await client.rainlink.create({
        guildId: handler.guild!.id,
        voiceId: handler.member!.voice.channel!.id,
        textId: String(handler.channel?.id),
        shardId: handler.guild?.shardId ?? 0,
        deaf: true,
        volume: client.config.player.DEFAULT_VOLUME,
      })

    data.voice
      ? await client.db.autoreconnect.set(`${handler.guild!.id}.twentyfourseven`, true)
      : await reconnectBuilder.playerBuild(player?.guildId, true)

    return handler.replyV2(
      buildV2({
        description: `${client.i18n.get(handler.language, 'command.utils', '247_on')}`,
        color: client.color,
      })
    )
  }
}
