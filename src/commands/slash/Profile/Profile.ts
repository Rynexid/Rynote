import {
  ApplicationCommandOptionType,
  AttachmentBuilder,
  ComponentType,
  MessageFlags,
  User,
} from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler, ParseMentionEnum } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'
import { Premium } from '../../../database/schema/Premium.js'
import { SpotifyUser } from '../../../database/schema/SpotifyUser.js'
import { History } from '../../../database/schema/History.js'

const UNLINK_BTN = 'profile:unlink-spotify'
const CONFIRM_BTN = 'profile:unlink-confirm'
const CANCEL_BTN = 'profile:unlink-cancel'
const COLLECTOR_TIME = 60_000

async function toBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

export default class implements Command {
  public name = ['profile']
  public description = "View your or someone else's profile with listening history"
  public category = 'Profile'
  public accessableby = [Accessableby.Member]
  public usage = '<mention>'
  public aliases = ['me']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'user',
      description: 'The user to show the profile of',
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    let target: User | null = handler.user ?? null
    const data = handler.args[0]

    if (data) {
      const getData = await handler.parseMentions(data)
      if (getData && getData.type === ParseMentionEnum.USER) {
        target = getData.data as User
      } else if (/^\d{17,19}$/.test(data)) {
        target = await client.users.fetch(data).catch(() => null)
      } else if (getData && getData.type === ParseMentionEnum.ERROR) {
        return handler.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: buildV2({
            color: client.color,
            description: client.i18n.get(handler.language, 'command.profile', 'profile_no_user'),
          }),
        } as any)
      }
    }

    if (!target) {
      return handler.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: buildV2({
          color: client.color,
          description: client.i18n.get(
            handler.language,
            'command.profile',
            'profile_user_not_found'
          ),
        }),
      } as any)
    }

    const forced = await client.users.fetch(target.id, { force: true }).catch(() => null)
    const fresh = forced ?? target

    const avatarUrl = fresh.avatar
      ? `https://cdn.discordapp.com/avatars/${fresh.id}/${fresh.avatar}.${
          fresh.avatar.startsWith('a_') ? 'gif' : 'png'
        }?size=512`
      : fresh.defaultAvatarURL

    const bannerUrl = fresh.bannerURL({ size: 1024 })

    const [avatarBuffer, bannerBuffer] = await Promise.all([
      toBuffer(avatarUrl),
      bannerUrl ? toBuffer(bannerUrl) : Promise.resolve(null),
    ])

    const files: AttachmentBuilder[] = []
    let avatarAttachmentUrl: string | null = null
    let bannerAttachmentUrl: string | null = null

    if (avatarBuffer) {
      const ext = avatarUrl.endsWith('.gif') ? 'gif' : 'png'
      const attachment = new AttachmentBuilder(avatarBuffer, { name: `avatar.${ext}` })
      files.push(attachment)
      avatarAttachmentUrl = `attachment://avatar.${ext}`
    }

    if (bannerBuffer) {
      const attachment = new AttachmentBuilder(bannerBuffer, { name: 'banner.png' })
      files.push(attachment)
      bannerAttachmentUrl = 'attachment://banner.png'
    }

    const [premium, spotify, history] = await Promise.all([
      client.db.premium.get(fresh.id),
      client.db.spotifyUser.get(fresh.id),
      client.db.history.get(fresh.id),
    ])

    const premiumData = premium as Premium | null
    const premiumStatus = this.formatPremium(client, handler, premiumData)
    const spotifyData = spotify as SpotifyUser | null
    const spotifyStatus = this.formatSpotify(client, handler, spotifyData)
    const historyData = (history as History | null | undefined) ?? []

    const historyText =
      historyData.length === 0
        ? client.i18n.get(handler.language, 'command.profile', 'profile_history_empty')
        : historyData
            .slice(0, 5)
            .map(
              (entry, i) =>
                `${i + 1}. ${entry.title}\n-# ${entry.author ?? client.i18n.get(handler.language, 'command.music', 'unknown')} • <t:${Math.floor(entry.playedAt / 1000)}:R>`
            )
            .join('\n')

    const mediaItems: any[] = []
    if (bannerAttachmentUrl) {
      mediaItems.push({
        type: 12,
        items: [
          { media: { url: bannerAttachmentUrl }, description: fresh.displayName },
          ...(avatarAttachmentUrl
            ? [
                {
                  media: { url: avatarAttachmentUrl },
                  description: client.i18n.get(
                    handler.language,
                    'command.profile',
                    'profile_avatar_footer'
                  ),
                },
              ]
            : []),
        ],
      })
    } else if (avatarAttachmentUrl) {
      mediaItems.push({
        type: 12,
        items: [{ media: { url: avatarAttachmentUrl }, description: fresh.displayName }],
      })
    }

    const actionRow: any[] = []
    if (spotifyData) {
      actionRow.push({
        type: 2,
        style: 5,
        label: client.i18n.get(handler.language, 'command.profile', 'profile_btn_spotify'),
        url: spotifyData.url,
      })
      if (handler.user && handler.user.id === fresh.id) {
        actionRow.push({
          type: 2,
          style: 4,
          label: client.i18n.get(handler.language, 'command.profile', 'spotify_logout_button'),
          custom_id: UNLINK_BTN,
        })
      }
    }
    actionRow.push({
      type: 2,
      style: 5,
      label: client.i18n.get(handler.language, 'command.profile', 'profile_btn_premium'),
      url: `https://rynote.gg/premium`,
    })

    const container = {
      type: 17,
      accent_color: typeof client.color === 'number' ? client.color : undefined,
      components: [
        {
          type: 10,
          content: `# ${fresh.displayName}`,
        },
        ...mediaItems,
        { type: 14, divider: true, spacing: 1 },
        {
          type: 10,
          content:
            `- **${client.i18n.get(handler.language, 'command.profile', 'profile_fields_username')}:** <@${fresh.id}> (${fresh.id})\n` +
            `- **${client.i18n.get(handler.language, 'command.profile', 'profile_fields_premium')}:** ${premiumStatus}\n` +
            `- **${client.i18n.get(handler.language, 'command.profile', 'profile_fields_spotify')}:** ${spotifyStatus}`,
        },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 10,
          content: `### ${client.i18n.get(handler.language, 'command.profile', 'profile_history_title')}\n${historyText}`,
        },
        ...(actionRow.length ? [{ type: 1, components: actionRow }] : []),
      ],
    }

    const payload = {
      flags: MessageFlags.IsComponentsV2,
      components: [container],
      files,
    }

    let msg: any
    if (handler.interaction) {
      msg = await handler.editReply(payload as any)
    } else {
      await handler.msg?.delete().catch(() => undefined)
      msg = await handler.sendMessage(payload as any)
    }

    if (spotifyData && handler.user && handler.user.id === fresh.id) {
      this.attachUnlinkCollector(client, handler, msg)
    }

    return msg
  }

  private attachUnlinkCollector(client: Manager, handler: CommandHandler, msg: any) {
    const first = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: COLLECTOR_TIME,
      max: 1,
      filter: (i: any) => i.customId === UNLINK_BTN && i.user.id === handler.user?.id,
    })

    first.on('collect', async (i: any) => {
      await i.deferUpdate().catch(() => undefined)

      const confirmRow = {
        type: 1,
        components: [
          {
            type: 2,
            style: 4,
            label: client.i18n.get(handler.language, 'command.profile', 'spotify_logout_confirm'),
            custom_id: CONFIRM_BTN,
          },
          {
            type: 2,
            style: 2,
            label: client.i18n.get(handler.language, 'command.profile', 'spotify_logout_cancel'),
            custom_id: CANCEL_BTN,
          },
        ],
      }

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
          confirmRow,
        ],
      }

      await msg.edit({ flags: MessageFlags.IsComponentsV2, components: [container] } as any)

      const second = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: COLLECTOR_TIME,
        max: 1,
        filter: (c: any) => c.user.id === handler.user?.id,
      })

      second.on('collect', async (c: any) => {
        await c.deferUpdate().catch(() => undefined)

        if (c.customId === CONFIRM_BTN) {
          const removed = await client.db.spotifyUser.delete(handler.user!.id)
          return msg.edit({
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

      second.on('end', () => {
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
    })
  }

  private formatPremium(client: Manager, handler: CommandHandler, premium: Premium | null): string {
    if (!premium || !premium.isPremium)
      return client.i18n.get(handler.language, 'command.profile', 'profile_premium_no')
    const expires =
      premium.expiresAt === 'lifetime'
        ? client.i18n.get(handler.language, 'command.profile', 'profile_premium_lifetime')
        : `<t:${Math.floor(premium.expiresAt / 1000)}:D>`
    return `${client.i18n.get(handler.language, 'command.profile', 'profile_premium_yes')} (${premium.plan}) — ${expires}`
  }

  private formatSpotify(
    client: Manager,
    handler: CommandHandler,
    spotify: SpotifyUser | null
  ): string {
    if (!spotify)
      return client.i18n.get(handler.language, 'command.profile', 'profile_spotify_not_linked')
    return `[${spotify.displayName}](${spotify.url}) — ${client.i18n.get(handler.language, 'command.profile', 'profile_spotify_linked')}`
  }
}
