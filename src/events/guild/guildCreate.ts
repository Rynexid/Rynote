import { Manager } from '../../manager.js'
import { Guild, MessageFlags, EmbedBuilder } from 'discord.js'
import { BlacklistService } from '../../services/BlacklistService.js'
import { RYNOTE_BANNER_URL } from '../../utilities/Links.js'

export default class {
  private formatUptime(ms: number): string {
    const days = Math.floor(ms / 86400000)
    const hours = Math.floor(ms / 3600000) % 24
    const minutes = Math.floor(ms / 60000) % 60
    const seconds = Math.floor(ms / 1000) % 60
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
  }

  async execute(client: Manager, guild: Guild) {
    const blacklistService = new BlacklistService(client)
    if (await blacklistService.checkGuild(guild.id)) {
      await guild.leave()
      client.logger.info(
        'GuildCreate',
        `Blocked guild ${guild.name} from joining due to blacklist restriction`
      )
      return
    }
    client.logger.info('GuildCreate', `Joined guild ${guild.name} @ ${guild.id}`)
    const owner = await guild.fetchOwner()
    const language = client.config.bot.LANGUAGE

    client.guilds.cache.set(`${guild!.id}`, guild)

    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(language, 'command.info', key, args)

    let PREFIX = client.prefix
    const GuildPrefix = await client.db.prefix.get(`${guild!.id}`)
    if (GuildPrefix) PREFIX = GuildPrefix

    const uptime = this.formatUptime(client.uptime || 0)
    const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
    const users = client.guilds.cache.reduce((a, b) => a + (b.memberCount || 0), 0)

    const thanks = client.i18n.get(language, 'event.guild', 'join_dm_thanks', {
      username: client.user!.username,
    })
    const welcome = client.i18n.get(language, 'event.guild', 'join_dm_welcome', {
      username: client.user!.username,
    })

    const info =
      `- ${L('botinfo_prefix')} \`${PREFIX}\` or \`/\`\n` +
      `- ${L('info_codename')} ${client.manifest.metadata.bot.codename}\n` +
      `- ${L('info_version')} ${client.manifest.metadata.bot.version}\n` +
      `- ${L('botinfo_type')} ${L('botinfo_type_val')}\n` +
      `- ${L('botinfo_lib')} Discord.js ${client.manifest.package.discordjs}\n` +
      `- ${L('info_rainlink')} ${client.manifest.package.rainlink}\n` +
      `- ${L('botinfo_autofix')} ${client.manifest.metadata.autofix.version}\n` +
      `- ${L('botinfo_powered')} [Rynex](https://rynexdev.vercel.app?ref=discord)\n` +
      `- ${L('botinfo_partnered')} 1sT - Services\n\n` +
      `${L('botinfo_stats')}\n` +
      `- ${L('botinfo_uptime')} ${uptime}\n` +
      `- ${L('info_guilds')} ${client.guilds.cache.size}\n` +
      `- ${L('info_users')} ${users}\n` +
      `- ${L('botinfo_channels')} ${client.channels.cache.size}\n` +
      `- ${L('info_commands')} ${client.commands.size + client.prefixCommands.size}\n` +
      `- ${L('botinfo_memory')} ${memory} MB`

    const content = `# ${thanks}\n\n${welcome}\n\n${info}`

    const container = {
      type: 17,
      accent_color: client.color,
      components: [
        {
          type: 12,
          items: [{ media: { url: RYNOTE_BANNER_URL }, description: client.user!.username }],
        },
        { type: 10, content },
      ],
    }

    const userDm = await owner.createDM(true).catch(() => null)
    if (userDm) {
      userDm
        .send({ flags: MessageFlags.IsComponentsV2, components: [container] } as any)
        .catch(() => {})
    }

    if (!client.config.utilities.GUILD_LOG_CHANNEL) return
    const eventChannel = await client.channels
      .fetch(client.config.utilities.GUILD_LOG_CHANNEL)
      .catch(() => undefined)
    if (!eventChannel || !eventChannel.isTextBased()) return
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${client.i18n.get(language, 'event.guild', 'joined_title')}`,
      })
      .addFields([
        {
          name: `${client.i18n.get(language, 'event.guild', 'guild_name')}`,
          value: String(guild.name),
        },
        {
          name: `${client.i18n.get(language, 'event.guild', 'guild_id')}`,
          value: String(guild.id),
        },
        {
          name: `${client.i18n.get(language, 'event.guild', 'guild_owner')}`,
          value: `${owner.displayName} [ ${guild.ownerId} ]`,
        },
        {
          name: `${client.i18n.get(language, 'event.guild', 'guild_member_count')}`,
          value: `${guild.memberCount}`,
        },
        {
          name: `${client.i18n.get(language, 'event.guild', 'guild_creation_date')}`,
          value: `<t:${(guild.createdAt.getTime() / 1000).toFixed()}:F>`,
        },
        {
          name: `${client.i18n.get(language, 'event.guild', 'current_server_count')}`,
          value: `${client.guilds.cache.size}`,
        },
      ])
      .setTimestamp()
      .setColor(client.color)

    eventChannel.messages.channel.send({ embeds: [embed] }).catch(() => null)
  }
}
