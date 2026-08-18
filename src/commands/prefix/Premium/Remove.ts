import { ApplicationCommandOptionType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['pmremove']
  public description = 'Remove premium from members!'
  public category = 'Premium'
  public accessableby = [Accessableby.Admin]
  public usage = '<id>'
  public aliases = ['prm']
  public lavalink = false
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'id',
      description: 'The user id you want to remove!',
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    const id = handler.args[0]

    if (!id)
      return handler.replyV2(
        buildV2({
          color: client.color as number,
          description: `${client.i18n.get(handler.language, 'command.premium', 'remove_no_params')}`,
        })
      )

    const db = await client.db.premium.get(`${id}`)

    if (!db)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.premium', 'remove_404', {
            userid: id as string,
          })}`,
        })
      )

    if (db.isPremium) {
      await client.db.premium.delete(`${id}`)

      return handler.replyV2(
        buildV2({
          color: client.color as number,
          description: `${client.i18n.get(handler.language, 'command.premium', 'remove_desc', {
            user: db.redeemedBy?.username as string,
          })}`,
        })
      )
    } else {
      return handler.replyV2(
        buildV2({
          color: client.color as number,
          description: `${client.i18n.get(handler.language, 'command.premium', 'remove_already', {
            user: db.redeemedBy?.username as string,
          })}`,
        })
      )
    }
  }
}
