import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import os from 'os'
import ms from 'pretty-ms'
import { stripIndents } from 'common-tags'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['host']
  public description = 'Show the host infomation/status!'
  public category = 'Owner'
  public accessableby = [Accessableby.Owner]
  public usage = ''
  public aliases = []
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const total = os.totalmem() / 1024 / 1024
    const used = process.memoryUsage().rss / 1024 / 1024
    const heapUsed = process.memoryUsage().heapUsed / 1024 / 1024
    const heapTotal = process.memoryUsage().heapUsed / 1024 / 1024

    const L = (key: string) =>
      client.i18n.get(handler.language, 'command.owner', key)

    const hostInfo = stripIndents`\`\`\`
    - ${L('host_os')}: ${os.type()} ${os.release()} (${os.arch()})
    - ${L('host_cpu')}: ${os.cpus()[0].model}
    - ${L('host_uptime')}: ${ms(client.uptime as number)}
    - ${L('host_ram')}: ${(total / 1024).toFixed(2)} GB
    - ${L('host_memory')}: ${used.toFixed(2)}/${total.toFixed(2)} (MB)
    - ├── ${L('host_rss')}: ${used.toFixed(2)} MB
    - ├── ${L('host_used_heap')}: ${heapUsed.toFixed(2)} MB
    - ├── ${L('host_total_heap')}: ${heapTotal.toFixed(2)} MB
    - ├── ${L('host_heap_usage')}: ${((heapUsed / heapTotal) * 100).toFixed(2)}%
    - └── ${L('host_external')}: ${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB
    - ${L('host_node')}: ${process.version}
    \`\`\``

    const botInfo = stripIndents`\`\`\`
    - ${L('bot_codename')}: ${client.manifest.metadata.bot.codename}
    - ${L('bot_version')}: ${client.manifest.metadata.bot.version}
    - ${L('bot_node')}: ${process.version}
    - ${L('bot_discordjs')}: ${client.manifest.package.discordjs}
    - ${L('bot_rainlink')}: ${client.manifest.package.rainlink}
    - ${L('bot_autofix_version')}: ${client.manifest.metadata.autofix.version}
    - ${L('bot_autofix_codename')}: ${client.manifest.metadata.autofix.codename}
    - ${L('bot_guild_count')}: ${client.guilds.cache.size}
    - ${L('bot_user_count')}: ${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)}
    - ${L('bot_total_packages')}: ${client.manifest.package.totalAmount}
    \`\`\``

    handler.editReply({
      flags: 32768,
      components: buildV2({
        title: client.i18n.get(handler.language, 'command.owner', 'host_title', {
          tag: client.user!.tag,
        }),
        color: client.color,
        fields: [
          { name: L('host_info'), value: hostInfo },
          { name: L('bot_info'), value: botInfo },
        ],
      }),
    } as any)
  }
}
