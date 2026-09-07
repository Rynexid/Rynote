import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'
import {
  extractSpotifyId,
  SpotifyNotFoundError,
  SpotifyService,
} from '../../../utilities/SpotifyService.js'

const MODAL_ID = 'spotify_login_modal'
const INPUT_ID = 'spotify_login_input'
const OPEN_BTN = 'spotify_login:open'
const COLLECTOR_TIME = 60_000

export default class implements Command {
  public name = ['spotify-login']
  public description = 'Link your Spotify profile to your Discord account'
  public category = 'Profile'
  public accessableby = [Accessableby.Member]
  public usage = '<spotify_profile_url|username>'
  public aliases = ['splogin', 'splink']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'profile',
      description: 'Your Spotify profile URL or username',
      type: 3 as const,
      required: false,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    const existing = await client.db.spotifyUser.get(handler.user?.id ?? '')
    if (existing) {
      return handler.replyV2(
        buildV2({
          color: client.color,
          description: client.i18n.get(
            handler.language,
            'command.profile',
            'spotify_login_already'
          ),
        })
      )
    }

    const directValue = handler.args[0]
    if (directValue) {
      await this.linkFromValue(client, handler, directValue)
      return
    }

    const service = new SpotifyService(client)
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(OPEN_BTN)
        .setLabel(client.i18n.get(handler.language, 'command.profile', 'spotify_login_open'))
        .setStyle(ButtonStyle.Primary)
    )

    const container = {
      type: 17,
      accent_color: typeof client.color === 'number' ? client.color : undefined,
      components: [
        {
          type: 10,
          content: `# ${client.i18n.get(handler.language, 'command.profile', 'spotify_login_title')}`,
        },
        {
          type: 10,
          content: client.i18n.get(handler.language, 'command.profile', 'spotify_login_notice'),
        },
        buttonRow.toJSON(),
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
      filter: (i) => i.user.id === handler.user?.id,
    })

    collector.on('collect', async (i: any) => {
      if (i.customId !== OPEN_BTN) return

      const modal = new ModalBuilder()
        .setCustomId(MODAL_ID)
        .setTitle(client.i18n.get(handler.language, 'command.profile', 'spotify_login_title'))
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId(INPUT_ID)
              .setLabel(
                client.i18n.get(handler.language, 'command.profile', 'spotify_login_input_label')
              )
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setPlaceholder(
                client.i18n.get(handler.language, 'command.profile', 'spotify_login_placeholder')
              )
          )
        )

      await i.showModal(modal)

      const submission = await i
        .awaitModalSubmit({
          time: 120_000,
          filter: (s) => s.customId === MODAL_ID && s.user.id === handler.user?.id,
        })
        .catch(() => null)

      if (!submission) return

      const raw = submission.fields.getTextInputValue(INPUT_ID)
      const spotifyId = extractSpotifyId(raw)

      if (!spotifyId) {
        await submission.deferUpdate()
        return msg.edit({
          flags: MessageFlags.IsComponentsV2,
          components: buildV2({
            color: client.color,
            description: client.i18n.get(
              handler.language,
              'command.profile',
              'spotify_login_invalid'
            ),
          }),
        } as any)
      }

      const profile = await service.fetchUser(spotifyId).catch(async (err: unknown) => {
        await submission.deferUpdate()
        const notFound = err instanceof SpotifyNotFoundError
        await msg.edit({
          flags: MessageFlags.IsComponentsV2,
          components: buildV2({
            color: client.color,
            description: client.i18n.get(
              handler.language,
              'command.profile',
              notFound ? 'spotify_login_notfound' : 'spotify_login_error'
            ),
          }),
        } as any)
        return null
      })

      if (!profile) return

      await client.db.spotifyUser.set(handler.user!.id, {
        id: profile.id,
        displayName: profile.displayName,
        url: profile.url,
        image: profile.image,
        linkedAt: Date.now(),
        followers: profile.followers,
      })

      await submission.deferUpdate()
      return msg.edit({
        flags: MessageFlags.IsComponentsV2,
        components: [
          {
            type: 17,
            accent_color: typeof client.color === 'number' ? client.color : undefined,
            components: [
              {
                type: 10,
                content: client.i18n.get(
                  handler.language,
                  'command.profile',
                  'spotify_login_success'
                ),
              },
              {
                type: 10,
                content: client.i18n.get(
                  handler.language,
                  'command.profile',
                  'spotify_login_success_desc',
                  {
                    displayName: profile.displayName,
                    playlists: `${profile.playlists.length}`,
                  }
                ),
              },
            ],
          },
        ],
      } as any)
    })

    collector.on('end', (_collected: any, reason: string) => {
      if (reason === 'time') {
        msg
          .edit({
            flags: MessageFlags.IsComponentsV2,
            components: buildV2({
              color: client.color,
              description: client.i18n.get(
                handler.language,
                'command.profile',
                'spotify_login_cancel'
              ),
            }),
          } as any)
          .catch(() => undefined)
      }
    })
  }

  private async linkFromValue(client: Manager, handler: CommandHandler, value: string) {
    const spotifyId = extractSpotifyId(value)
    if (!spotifyId) {
      return handler.replyV2(
        buildV2({
          color: client.color,
          description: client.i18n.get(
            handler.language,
            'command.profile',
            'spotify_login_invalid'
          ),
        })
      )
    }

    const service = new SpotifyService(client)
    const profile = await service.fetchUser(spotifyId).catch(async (err: unknown) => {
      const notFound = err instanceof SpotifyNotFoundError
      await handler.replyV2(
        buildV2({
          color: client.color,
          description: client.i18n.get(
            handler.language,
            'command.profile',
            notFound ? 'spotify_login_notfound' : 'spotify_login_error'
          ),
        })
      )
      return null
    })

    if (!profile) return

    await client.db.spotifyUser.set(handler.user!.id, {
      id: profile.id,
      displayName: profile.displayName,
      url: profile.url,
      image: profile.image,
      linkedAt: Date.now(),
      followers: profile.followers,
    })

    return handler.replyV2(
      buildV2({
        color: client.color,
        description:
          client.i18n.get(handler.language, 'command.profile', 'spotify_login_success') +
          '\n' +
          client.i18n.get(handler.language, 'command.profile', 'spotify_login_success_desc', {
            displayName: profile.displayName,
            playlists: `${profile.playlists.length}`,
          }),
      })
    )
  }
}
