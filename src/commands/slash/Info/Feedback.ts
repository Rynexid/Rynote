import {
  ActionRowBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

const MODAL_ID = 'feedback_modal'
const CATEGORY_INPUT = 'feedback_category'
const MESSAGE_INPUT = 'feedback_message'
const MODAL_TIME = 120_000

export default class implements Command {
  public name = ['feedback']
  public description = 'Send feedback, suggestions or report a bug to the team'
  public category = 'Info'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['fb']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.info', key, args)

    if (!handler.interaction) {
      return handler.replyV2(buildV2({ color: client.color, description: L('feedback_use_slash') }))
    }

    const webhook = client.config.utilities.FEEDBACK?.webhook
    if (!webhook) {
      return handler.replyV2(
        buildV2({ color: client.color, description: L('feedback_not_configured') })
      )
    }

    const modal = new ModalBuilder()
      .setCustomId(MODAL_ID)
      .setTitle(L('feedback_modal_title'))
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(CATEGORY_INPUT)
            .setLabel(L('feedback_category_label'))
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(30)
            .setPlaceholder(L('feedback_category_placeholder'))
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(MESSAGE_INPUT)
            .setLabel(L('feedback_message_label'))
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMinLength(5)
            .setMaxLength(2000)
            .setPlaceholder(L('feedback_message_placeholder'))
        )
      )

    await handler.interaction.showModal(modal)

    const submission = await handler.interaction
      .awaitModalSubmit({
        time: MODAL_TIME,
        filter: (s) => s.customId === MODAL_ID && s.user.id === handler.user?.id,
      })
      .catch(() => null)

    if (!submission) return

    const category = submission.fields.getTextInputValue(CATEGORY_INPUT).trim()
    const message = submission.fields.getTextInputValue(MESSAGE_INPUT).trim()
    const support = client.config.bot.SUPPORT || 'https://discord.gg/J8MJBPBupy'

    const embed = {
      color: typeof client.color === 'number' ? client.color : undefined,
      author: {
        name: `${handler.user?.username} (${handler.user?.id})`,
        icon_url: handler.user?.displayAvatarURL(),
        url: `https://discord.com/users/${handler.user?.id}`,
      },
      description: message,
      fields: [
        {
          name: L('feedback_embed_category'),
          value: category || L('feedback_category_general'),
          inline: true,
        },
        {
          name: L('feedback_embed_server'),
          value: handler.guild?.name ?? '-',
          inline: true,
        },
      ],
      footer: { text: `Rynote Feedback` },
      timestamp: new Date().toISOString(),
    }

    const sent = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
      .then((res) => res.ok)
      .catch(() => false)

    await submission.reply({
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      components: sent
        ? buildV2({
            color: client.color,
            description: `${L('feedback_sent')}\n${L('feedback_sent_desc')}`,
            buttons: [[{ label: L('btn_support_server'), style: 5, url: support }]],
          })
        : buildV2({ color: client.color, description: L('feedback_failed') }),
    } as any)
  }
}
