import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js'
import { Manager } from '../manager.js'

export class ReplyInteractionService {
  constructor(
    protected client: Manager,
    protected message: ButtonInteraction | StringSelectMenuInteraction,
    protected content: string
  ) {
    this.execute()
  }

  async execute() {
    const components = [
      {
        type: 17,
        accent_color: typeof this.client.color === 'number' ? this.client.color : undefined,
        components: [{ type: 10, content: this.content }],
      },
    ]

    const msg = await this.message
      .followUp({
        flags: 32768,
        components,
        ephemeral: true,
      } as any)
      .catch(() => null)
    const setup = await this.client.db.setup.get(String(this.message.guildId))

    setTimeout(() => {
      ;(!setup || setup == null || setup.channel !== this.message.channelId) && msg
        ? msg.delete().catch(() => null)
        : true
    }, this.client.config.utilities.DELETE_MSG_TIMEOUT)
  }
}
