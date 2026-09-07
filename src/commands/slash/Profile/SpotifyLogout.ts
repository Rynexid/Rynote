import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

const CONFIRM_BTN = 'spotify_logout:confirm'
const CANCEL_BTN = 'spotify_logout:cancel'
const COLLECTOR_TIME = 60_000

export default class implements Command {
  public name = ['spotify-logout']
  public description = 'Unlink your Spotify profile from your Discord account'
  public category = 'Profile'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['splogout', 'spunlink']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    const profile = await client.db.spotifyUser.get(handler.user?.id ?? '')
    if (!profile) {
      return handler.replyV2(
        buildV2({
          color: client.color,
          description: client.i18n.get(
            handler.language,
            'command.profile',
            'spotify_logout_not_linked'
          ),
        })
      )
    }

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(CONFIRM_BTN)
        .setLabel(client.i18n.get(handler.language, 'command.profile', 'spotify_logout_confirm'))
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(CANCEL_BTN)
        .setLabel(client.i18n.get(handler.language, 'command.profile', 'spotify_logout_cancel'))
        .setStyle(ButtonStyle.Secondary)
    )

    const container = {
      type: 17,
      accent_color: typeof client.color === 'number' ? client.color : undefined,
      components: [
        {
          type: 10,
          content: `# ${client.i18n.get(handler.language, 'command.profile', 'spotify_logout_title')}`,
        },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 10,
          content: client.i18n.get(
            handler.language,
            'command.profile',
            'spotify_logout_confirm_desc'
          ),
        },
        { type: 14, divider: true, spacing: 1 },
        confirmRow.toJSON(),
      ],
    }

    let msg: any
    if (handler.interaction) {
      await handler.deferReply()
      msg = await handler.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      } as any)
    } else {
      msg = await handler.sendMessage({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      } as any)
    }

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: COLLECTOR_TIME,
      max: 1,
      filter: (i) => i.user.id === handler.user?.id,
    })

    collector.on('collect', async (i: any) => {
      await i.deferUpdate().catch(() => undefined)

      if (i.customId === CONFIRM_BTN) {
        const removed = await client.db.spotifyUser.delete(handler.user!.id)
        await msg.edit({
          flags: MessageFlags.IsComponentsV2,
          components: buildV2({
            color: client.color,
            description: client.i18n.get(
              handler.language,
              'command.profile',
              removed ? 'spotify_logout_success' : 'spotify_logout_failed'
            ),
          }),
        } as any)
        return
      }

      await msg.edit({
        flags: MessageFlags.IsComponentsV2,
        components: buildV2({
          color: client.color,
          description: client.i18n.get(
            handler.language,
            'command.profile',
            'spotify_logout_cancelled'
          ),
        }),
      } as any)
    })

    collector.on('end', () => {
      msg
        .edit({
          flags: MessageFlags.IsComponentsV2,
          components: buildV2({
            color: client.color,
            description: client.i18n.get(
              handler.language,
              'command.profile',
              'spotify_logout_timeout'
            ),
          }),
        } as any)
        .catch(() => undefined)
    })
  }
}
