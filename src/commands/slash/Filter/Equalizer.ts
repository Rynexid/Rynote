import { ApplicationCommandOptionType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['equalizer']
  public description = 'Custom Equalizer!'
  public category = 'Filter'
  public accessableby = [Accessableby.Member]
  public usage = '<number>'
  public aliases = ['equalizer']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []
  public options = [
    {
      name: 'bands',
      description: 'Number of bands to use (max 14 bands.)',
      type: ApplicationCommandOptionType.String,
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

    if (!value) {
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.filter', 'eq_desc')}`,
          color: client.color,
          fields: [
            {
              name: `${client.i18n.get(handler.language, 'command.filter', 'eq_field_title')}`,
              value: `${client.i18n.get(handler.language, 'command.filter', 'eq_field_value', {
                prefix: handler.prefix,
              })}`,
            },
          ],
          footer: `${client.i18n.get(handler.language, 'command.filter', 'eq_footer', {
            prefix: handler.prefix,
          })}`,
        })
      )
    } else if (value == 'off' || value == 'reset') return player?.filter.clear()

    const bands = value.split(/[ ]+/)
    let bandsStr = ''
    for (let i = 0; i < bands.length; i++) {
      if (i > 13) break
      if (isNaN(+bands[i]))
        return handler.replyV2(
          buildV2({
            description: `${client.i18n.get(handler.language, 'command.filter', 'eq_number')}`,
            color: client.color,
          })
        )
      if (Number(bands[i]) > 10)
        return handler.replyV2(
          buildV2({
            description: `${client.i18n.get(handler.language, 'command.filter', 'eq_than')}`,
            color: client.color,
          })
        )

      if (Number(bands[i]) < -10)
        return handler.replyV2(
          buildV2({
            description: `${client.i18n.get(handler.language, 'command.filter', 'eq_greater')}`,
            color: client.color,
          })
        )
    }

    for (let i = 0; i < bands.length; i++) {
      if (i > 13) break
      player?.filter.setEqualizer([{ band: i, gain: Number(bands[i]) / 10 }])
      bandsStr += `${bands[i]} `
    }

    player?.data.set('filter-mode', this.name[0])

    return handler.replyV2(
      buildV2({
        description: `${client.i18n.get(handler.language, 'command.filter', 'eq_on', {
          bands: bandsStr,
        })}`,
        color: client.color,
      })
    )
  }
}
