import { ApplicationCommandOptionType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['language']
  public description = 'Change the language for the bot'
  public category = 'Utils'
  public accessableby = [Accessableby.Manager]
  public usage = '<language>'
  public aliases = ['lang', 'language']
  public lavalink = false
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []

  public options = [
    {
      name: 'input',
      description: 'The new language',
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    const input = handler.args[0]

    const languages = client.i18n.getLocales()

    if (!languages.includes(input as string)) {
      const onsome = {
        description: `${client.i18n.get(handler.language, 'command.utils', 'provide_lang', {
          languages: languages.join(', '),
        })}`,
        color: client.color as number,
      }
      return handler.replyV2(buildV2(onsome))
    }

    const newLang = await client.db.language.get(`${handler.guild!.id}`)

    if (!newLang) {
      await client.db.language.set(`${handler.guild!.id}`, input)
      const embed = {
        description: `${client.i18n.get(handler.language, 'command.utils', 'lang_set', {
          language: String(input),
        })}`,
        color: client.color as number,
      }

      return handler.replyV2(buildV2(embed))
    } else if (newLang) {
      await client.db.language.set(`${handler.guild!.id}`, input)

      const embed = {
        description: `${client.i18n.get(handler.language, 'command.utils', 'lang_change', {
          language: String(input),
        })}`,
        color: client.color as number,
      }

      return handler.replyV2(buildV2(embed))
    }
  }
}
