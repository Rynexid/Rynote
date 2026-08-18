import { ApplicationCommandOptionType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['rate']
  public description = 'Sets the rate of the song.'
  public category = 'Filter'
  public accessableby = [Accessableby.Member]
  public usage = '<number>'
  public aliases = ['rate']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []
  public options = [
    {
      name: 'amount',
      description: 'The amount of rate to set the song to.',
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const value = handler.args[0]

    if (value && isNaN(+value))
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'error', 'number_invalid')}`,
          color: client.color,
        })
      )

    const player = client.rainlink.players.get(handler.guild!.id)

    if (Number(value) < 0)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.filter', 'filter_greater')}`,
          color: client.color,
        })
      )
    if (Number(value) > 10)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.filter', 'filter_less')}`,
          color: client.color,
        })
      )

    player?.filter.setTimescale({ rate: Number(value) })
    player?.data.set('filter-mode', this.name[0])

    return handler.replyV2(
      buildV2({
        description: `${client.i18n.get(handler.language, 'command.filter', 'rate_on', {
          amount: value,
        })}`,
        color: client.color,
      })
    )
  }
}
