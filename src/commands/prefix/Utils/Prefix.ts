import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['prefix']
  public description = 'Change the prefix for the bot'
  public category = 'Utils'
  public accessableby = [Accessableby.Manager]
  public usage = '<input>'
  public aliases = ['setprefix']
  public lavalink = false
  public playerCheck = false
  public usingInteraction = false
  public sameVoiceCheck = false
  public permissions = []

  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    if (!handler.args[0])
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.utils', 'prefix_arg')}`,
          color: client.color as number,
        })
      )

    if (handler.args[0].length > 10)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.utils', 'prefix_length')}`,
          color: client.color as number,
        })
      )

    const newPrefix = await client.db.prefix.get(`${handler.guild!.id}`)

    if (!newPrefix) {
      await client.db.prefix.set(`${handler.guild!.id}`, handler.args[0])

      const embed = {
        description: `${client.i18n.get(handler.language, 'command.utils', 'prefix_set', {
          prefix: handler.args[0],
        })}`,
        color: client.color as number,
      }

      return handler.replyV2(buildV2(embed))
    } else if (newPrefix) {
      await client.db.prefix.set(`${handler.guild!.id}`, handler.args[0])

      const embed = {
        description: `${client.i18n.get(handler.language, 'command.utils', 'prefix_change', {
          prefix: handler.args[0],
        })}`,
        color: client.color as number,
      }

      return handler.replyV2(buildV2(embed))
    }
  }
}
