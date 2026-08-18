import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

// Main code
export default class implements Command {
  public name = ['join']
  public description = 'Make the bot join the voice channel.'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['j']
  public lavalink = true
  public options = []
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const { channel } = handler.member!.voice
    if (!channel)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'error', 'no_in_voice')}`,
          color: client.color,
        })
      )

    let player = client.rainlink.players.get(handler.guild!.id)

    if (!player)
      player = await client.rainlink.create({
        guildId: handler.guild!.id,
        voiceId: handler.member!.voice.channel!.id,
        textId: handler.channel!.id,
        shardId: handler.guild?.shardId ?? 0,
        deaf: true,
        volume: client.config.player.DEFAULT_VOLUME,
      })
    else if (player && !this.checkSameVoice(client, handler, handler.language)) {
      return
    }

    player.textId = handler.channel!.id

    const embed = {
      description: `${client.i18n.get(handler.language, 'command.music', 'join_msg', {
        channel: String(channel),
      })}`,
      color: client.color,
    }

    handler.replyV2(buildV2(embed))
  }

  checkSameVoice(client: Manager, handler: CommandHandler, language: string) {
    if (handler.member!.voice.channel !== handler.guild!.members.me!.voice.channel) {
      handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'error', 'no_same_voice')}`,
          color: client.color,
        })
      )
      return false
    } else if (handler.member!.voice.channel === handler.guild!.members.me!.voice.channel) {
      handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'join_already', {
            channel: String(handler.member!.voice.channel),
          })}`,
          color: client.color,
        })
      )
      return false
    }

    return true
  }
}
