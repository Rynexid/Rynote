import { ApplicationCommandOptionType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkFilterData, RainlinkFilterMode } from 'rainlink'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['filter']
  public description = 'Turning on some built-in filter'
  public category = 'Filter'
  public accessableby = [Accessableby.Member]
  public usage = '<filter_name>'
  public aliases = []
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []
  public options = [
    {
      name: 'name',
      description: 'The name of filter',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const filterList = Object.keys(RainlinkFilterData).filter((e) => e !== 'clear')

    const filterName = handler.args[0]

    const player = client.rainlink.players.get(handler.guild!.id)

    if (!filterName || !filterList.find((e) => e == filterName)) {
      return handler.replyV2(
        buildV2({
          description: client.i18n.get(handler.language, 'command.filter', 'filter_avaliable', {
            amount: String(filterList.length),
            list: filterList.join(', '),
          }),
          color: client.color,
        })
      )
    }

    if (!player?.data.get('filter-mode')) {
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.filter', 'reset_already')}`,
          color: client.color,
        })
      )
    }

    if (player?.data.get('filter-mode') == filterName) {
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.filter', 'filter_already', {
            name: filterName,
          })}`,
          color: client.color,
        })
      )
    }

    player?.data.set('filter-mode', filterName)
    player?.filter.set(filterName as RainlinkFilterMode)

    return handler.replyV2(
      buildV2({
        description: `${client.i18n.get(handler.language, 'command.filter', 'filter_on', {
          name: filterName,
        })}`,
        color: client.color,
      })
    )
  }
}
