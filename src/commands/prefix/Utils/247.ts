import { ApplicationCommandOptionType, Message } from 'discord.js'
import { Manager } from '../../../manager.js'
import { AutoReconnectBuilderService } from '../../../services/AutoReconnectBuilderService.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['247']
  public description = '24/7 in voice channel'
  public category = 'Utils'
  public accessableby = [Accessableby.Manager]
  public usage = '<enable> or <disable>'
  public aliases = []
  public lavalink = true
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []

  public options = [
    {
      name: 'type',
      description: 'Choose enable or disable',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: 'Enable',
          value: 'enable',
        },
        {
          name: 'Disable',
          value: 'disable',
        },
      ],
    },
  ]
  public playerCheck = false

  public async execute(client: Manager, handler: CommandHandler) {
    let player = client.rainlink.players.get(handler.guild!.id)

    const value = handler.args[0]

    const reconnectBuilder = new AutoReconnectBuilderService(client, player)

    const data = await reconnectBuilder.execute(handler.guild?.id!)

    if (value == 'disable') {
      if (!data.twentyfourseven) {
        const offAl = {
          description: `${client.i18n.get(handler.language, 'command.utils', '247_already', {
            mode: handler.modeLang.disable,
          })}`,
          color: client.color as number,
        }
        return handler.replyV2(buildV2(offAl))
      }

      data.current || data.current.length !== 0
        ? await client.db.autoreconnect.set(`${handler.guild!.id}.twentyfourseven`, false)
        : await client.db.autoreconnect.delete(`${handler.guild!.id}`)

      player ? player.data.set('sudo-destroy', true) : true
      player && player.voiceId && handler.member!.voice.channel == null ? player.destroy() : true

      const on = {
        description: `${client.i18n.get(handler.language, 'command.utils', '247_off')}`,
        color: client.color as number,
      }
      return handler.replyV2(buildV2(on))
    } else if (value == 'enable') {
      const { channel } = handler.member!.voice
      if (!channel || handler.member!.voice.channel == null)
        return handler.replyV2(
          buildV2({
            description: `${client.i18n.get(handler.language, 'error', 'no_in_voice')}`,
            color: client.color as number,
          })
        )

      if (data.twentyfourseven) {
        const onAl = {
          description: `${client.i18n.get(handler.language, 'command.utils', '247_already', {
            mode: handler.modeLang.enable,
          })}`,
          color: client.color as number,
        }
        return handler.replyV2(buildV2(onAl))
      }

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
        : new AutoReconnectBuilderService(client, player).playerBuild(player?.guildId, true)

      const on = {
        description: `${client.i18n.get(handler.language, 'command.utils', '247_on')}`,
        color: client.color as number,
      }
      return handler.replyV2(buildV2(on))
    } else {
      const onsome = {
        description: `${client.i18n.get(handler.language, 'error', 'arg_error', {
          text: '**enable** or **disable**!',
        })}`,
        color: client.color as number,
      }
      return handler.replyV2(buildV2(onsome))
    }
  }
}
