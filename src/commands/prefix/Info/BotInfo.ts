import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

const BANNER = 'https://s6.imgcdn.dev/YHjUan.png'

export default class implements Command {
  public name = ['botinfo']
  public description = 'Shows detailed information about the bot.'
  public category = 'Info'
  public accessableby = [Accessableby.Member]
  public usage = ''
  public aliases = ['bot', 'about', 'stats']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    const uptime = this.formatUptime(client.uptime || 0)
    const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
    const users = client.guilds.cache.reduce((a, b) => a + (b.memberCount || 0), 0)

    const guildPrefix = handler.guild ? await client.db.prefix.get(handler.guild.id) : null
    const prefix = guildPrefix ?? client.prefix

    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.info', key, args)

    const info =
      `### ${client.user!.username} Information\n` +
      `- ${L('botinfo_prefix')} \`${prefix}\` or \`/\`\n` +
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

    const container = {
      type: 17,
      accent_color: client.color,
      components: [
        { type: 10, content: L('info_title', { username: client.user!.username }) },
        { type: 12, items: [{ media: { url: BANNER }, description: client.user!.username }] },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: info },
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
            {
              type: 2,
              style: 5,
              label: L('btn_invite'),
              url: `https://discord.com/oauth2/authorize?client_id=${client.user!.id}&permissions=8&scope=bot%20applications.commands`,
            },
          ],
        },
      ],
    }

    await handler.replyV2([container] as any)
  }

  private formatUptime(ms: number): string {
    const days = Math.floor(ms / 86400000)
    const hours = Math.floor(ms / 3600000) % 24
    const minutes = Math.floor(ms / 60000) % 60
    const seconds = Math.floor(ms / 1000) % 60
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
  }
}
