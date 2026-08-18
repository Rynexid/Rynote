import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'

export default class implements Command {
  public name = ['developer']
  public description = 'Shows the developer information of the Bot (Credit)'
  public category = 'Info'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['dev', 'credit', 'credits']
  public lavalink = false
  public options = []
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []

  public async execute(client: Manager, handler: CommandHandler) {
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.info', key, args)

    const content =
      `${L('dev_team_title')}\n` +
      `- ${L('dev_lead')} [Rynex](https://rynexdev.vercel.app?ref=discord)\n` +
      `- ${L('dev_base')} [Rynote](https://github.com/Rynexid)\n` +
      `- ${L('dev_botname')} ${client.user!.username}\n` +
      `- ${L('dev_spec')} ${L('dev_spec_val')}\n` +
      `- ${L('dev_status')} ${L('dev_status_val')}\n\n` +
      `${L('dev_note')}`

    const container = {
      type: 17,
      accent_color: client.color,
      components: [
        { type: 10, content: `# ${L('dev_team_title')}` },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: L('btn_github'),
              url: 'https://github.com/Rynexid',
            },
            {
              type: 2,
              style: 5,
              label: L('btn_support_server'),
              url: 'https://discord.gg/CJJ7KEJMbg',
            },
          ],
        },
      ],
    }

    await handler.replyV2([container] as any)
  }
}
