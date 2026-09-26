import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Guild } from 'discord.js'
import { Manager } from '../manager.js'
import { RYNOTE_BANNER_URL, RYNOTE_BOT_INVITE, RYNOTE_WEBSITE } from '../utilities/Links.js'

export type GuildLogType = 'joined' | 'left'

const COLOR: Record<GuildLogType, number> = {
  joined: 0x57f287,
  left: 0xed4245,
}

const EMOJI: Record<GuildLogType, string> = {
  joined: '📥',
  left: '📤',
}

export class GuildLogService {
  constructor(
    private client: Manager,
    private guild: Guild,
    private type: GuildLogType
  ) {}

  public async execute(owner: { displayName: string; id: string }, invite?: string) {
    const embed = this.buildEmbed(owner)
    const components = this.buildComponents(invite)
    await this.sendToChannel(embed, components).catch(() => undefined)
    await this.sendToWebhook(embed, components).catch(() => undefined)
  }

  private buildComponents(invite?: string) {
    if (!invite || invite.length == 0) return []
    const language = this.client.config.bot.LANGUAGE
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel(this.client.i18n.get(language, 'event.guild', 'join_button'))
          .setURL(invite)
      ),
    ]
  }

  private buildEmbed(owner: { displayName: string; id: string }) {
    const language = this.client.config.bot.LANGUAGE
    const title = this.client.i18n.get(
      language,
      'event.guild',
      this.type === 'joined' ? 'joined_title' : 'leave_title'
    )
    const field = (key: string, value: string) => ({
      name: this.client.i18n.get(language, 'event.guild', key),
      value,
      inline: true,
    })
    return new EmbedBuilder()
      .setAuthor({ name: title, url: RYNOTE_WEBSITE })
      .setColor(COLOR[this.type])
      .setImage(RYNOTE_BANNER_URL)
      .setURL(RYNOTE_BOT_INVITE)
      .addFields([
        field('guild_name', `\`${guildSafe(this.guild.name)}\``),
        field('guild_id', `\`${this.guild.id}\``),
        field('guild_owner', `\`${guildSafe(owner.displayName)}\``),
        field('guild_member_count', `\`${this.guild.memberCount}\``),
        field('guild_creation_date', `<t:${(this.guild.createdAt.getTime() / 1000).toFixed()}:D>`),
        field('current_server_count', `\`${this.client.guilds.cache.size}\``),
      ])
      .setFooter({
        text: `${EMOJI[this.type]} Rynote v${this.client.manifest.metadata.bot.version} • ${this.client.user?.username}`,
      })
      .setTimestamp()
  }

  private async sendToChannel(embed: EmbedBuilder, components: ActionRowBuilder<ButtonBuilder>[]) {
    const channelId = this.client.config.utilities.GUILD_LOG_CHANNEL
    if (!channelId || channelId.length == 0) return
    const eventChannel = await this.client.channels
      .fetch(channelId)
      .catch(() => undefined)
    if (!eventChannel || !eventChannel.isTextBased()) return
    await eventChannel.messages.channel.send({ embeds: [embed], components })
  }

  private async sendToWebhook(embed: EmbedBuilder, components: ActionRowBuilder<ButtonBuilder>[]) {
    const webhook = this.client.config.utilities.GUILD_LOG_WEBHOOK
    if (!webhook || webhook.length == 0) return
    const payload: Record<string, unknown> = {
      embeds: [embed.toJSON()],
    }
    const voice: unknown[] = components.map((row) => row.toJSON())
    if (voice.length) payload.components = voice
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }
}

function guildSafe(name: string) {
  return name.replace(/`/g, "'")
}