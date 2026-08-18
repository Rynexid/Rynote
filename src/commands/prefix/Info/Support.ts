import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'

export default class implements Command {
  public name = ['support']
  public description = 'Get support and help with the bot.'
  public category = 'Info'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['help-server', 'discord', 'server']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.info', key, args)

    const content =
      `${L('support_heading', { username: client.user!.username })}\n` +
      `${L('support_items')}\n\n` +
      `${L('support_note')}`

    const container = {
      type: 17,
      accent_color: client.color,
      components: [
        { type: 10, content: `# ${L('support_title')}` },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: L('btn_support_server'),
              url: client.config.bot.SUPPORT ?? 'https://discord.gg/CJJ7KEJMbg',
            },
          ],
        },
      ],
    }

    await handler.replyV2([container] as any)
  }
}
