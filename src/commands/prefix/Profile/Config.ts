import { ApplicationCommandOptionType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'
import { RYNOTE_BANNER_URL } from '../../../utilities/Links.js'
import { Cover } from '../../../database/schema/Cover.js'
import { Premium } from '../../../database/schema/Premium.js'
import { SongNotiEnum } from '../../../database/schema/SongNoti.js'

export default class implements Command {
  public name = ['config']
  public description = 'Set up bot features for your profile (premium cover, etc.)'
  public category = 'Profile'
  public accessableby = [Accessableby.Member]
  public usage = '<option> <value>'
  public aliases = ['settings', 'cfg']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'setting',
      description: 'The setting you want to view or change',
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: 'cover', value: 'cover' },
        { name: 'cover-remove', value: 'cover-remove' },
      ],
    },
    {
      name: 'value',
      description: 'The value for the setting (e.g. an image URL for cover)',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.config', key, args)

    const mode = (handler.args[0] ?? '').toLowerCase()
    const value = handler.args[1]?.trim()

    const isPremiumUser = async (id: string): Promise<boolean> => {
      const premium = (await client.db.premium.get(id)) as Premium | null
      return premium != null && premium.isPremium
    }

    if (!mode) return this.renderStatus(client, handler, L)

    if (mode === 'cover') {
      if (!value) {
        return handler.replyV2(
          buildV2({
            color: 0xed4245,
            description: L('cover_no_value'),
          })
        )
      }
      if (!/^https?:\/\//.test(value)) {
        return handler.replyV2(
          buildV2({
            color: 0xed4245,
            description: L('cover_invalid_url'),
          })
        )
      }
      if (!(await isPremiumUser(handler.user!.id))) {
        return handler.replyV2(
          buildV2({
            color: 0xed4245,
            description: L('cover_premium_only'),
          })
        )
      }

      const cover: Cover = {
        id: handler.user!.id,
        url: value,
        setAt: Date.now(),
      }
      await client.db.cover.set(handler.user!.id, cover)

      return handler.replyV2(
        buildV2({
          color: client.color as number,
          description: L('cover_set'),
        })
      )
    }

    if (mode === 'cover-remove') {
      if (!(await isPremiumUser(handler.user!.id))) {
        return handler.replyV2(
          buildV2({
            color: 0xed4245,
            description: L('cover_premium_only'),
          })
        )
      }
      const removed = await client.db.cover.delete(handler.user!.id)
      return handler.replyV2(
        buildV2({
          color: client.color as number,
          description: L(removed ? 'cover_removed' : 'cover_not_set'),
        })
      )
    }

    return handler.replyV2(
      buildV2({
        color: 0xed4245,
        description: client.i18n.get(handler.language, 'error', 'arg_error', {
          text: '**cover** or **cover-remove**!',
        }),
      })
    )
  }

  private async renderStatus(
    client: Manager,
    handler: CommandHandler,
    L: (key: string, args?: Record<string, string>) => string
  ) {
    const [cover, premium, songnoti, setup, lang, maxlen, prefix] = await Promise.all([
      client.db.cover.get(handler.user!.id),
      client.db.premium.get(handler.user!.id),
      handler.guild ? client.db.songNoti.get(handler.guild.id) : null,
      handler.guild ? client.db.setup.get(handler.guild.id) : null,
      handler.guild ? client.db.language.get(handler.guild.id) : null,
      handler.guild ? client.db.maxlength.get(handler.guild.id) : null,
      handler.guild ? client.db.prefix.get(handler.guild.id) : null,
    ])

    const bool = (v: unknown) => (v === null || v === undefined || v === false ? false : true)

    const coverSet = bool((cover as Cover | null)?.url) && bool(premium?.isPremium)

    const lines = [
      `- **${L('setting_cover')}:** \`${coverSet ? 'true' : 'false'}\``,
      `- **${L('setting_premium')}:** \`${bool((premium as Premium | null)?.isPremium) ? 'true' : 'false'}\``,
      `- **${L('setting_songnoti')}:** \`${songnoti === SongNotiEnum.Enable ? 'true' : 'false'}\``,
      `- **${L('setting_setup')}:** \`${bool((setup as any)?.enable) ? 'true' : 'false'}\``,
      `- **${L('setting_language')}:** \`${bool(lang) ? 'true' : 'false'}\``,
      `- **${L('setting_maxlength')}:** \`${bool(maxlen) ? 'true' : 'false'}\``,
      `- **${L('setting_prefix')}:** \`${bool(prefix) ? 'true' : 'false'}\``,
    ]

    const container = {
      type: 17,
      accent_color: typeof client.color === 'number' ? client.color : undefined,
      components: [
        { type: 10, content: `# ⚙️ ${L('title')}` },
        {
          type: 10,
          content: `-# ${L('subtitle')}`,
        },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 10,
          content: lines.join('\n'),
        },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 10,
          content: L('howto_cover', { banner: RYNOTE_BANNER_URL }),
        },
      ],
    }

    return handler.replyV2([container])
  }
}
