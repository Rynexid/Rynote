import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['invite']
  public description = 'Shows the invite information of the Bot'
  public category = 'Info'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = []
  public lavalink = false
  public options = []
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []

  public async execute(client: Manager, handler: CommandHandler) {
    const data = {
      title: `${client.i18n.get(handler.language, 'command.info', 'inv_title', {
        username: client.user!.username,
      })}`,
      description: `${client.i18n.get(handler.language, 'command.info', 'inv_desc', {
        username: client.user!.username,
      })}`,
      color: client.color as number,
      fields: [
        {
          name: `${client.i18n.get(handler.language, 'command.info', 'invite_field_name')}`,
          value: `${client.i18n.get(handler.language, 'command.info', 'invite_field_value')}`,
          inline: false,
        },
      ],
      buttons: [
        [
          {
            label: `${client.i18n.get(handler.language, 'command.info', 'btn_invite_me')}`,
            url: client.config.bot.INVITE || `https://discord.com/api/oauth2/authorize?client_id=${
              client.user!.id
            }&permissions=274877991936&scope=bot%20applications.commands`,
            style: 5,
          },
        ],
      ],
    }

    await handler.replyV2(buildV2(data))
  }
}
