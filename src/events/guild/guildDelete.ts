import { Manager } from '../../manager.js'
import { Guild } from 'discord.js'
import { GuildLogService } from '../../services/GuildLogService.js'

export default class {
  async execute(client: Manager, guild: Guild) {
    client.logger.info('GuildDelete', `Left guild ${guild.name} @ ${guild.id}`)
    client.guilds.cache.delete(`${guild!.id}`)
    const owner = await guild.fetchOwner().catch(() => undefined)
    new GuildLogService(client, guild, 'left').execute({
      displayName: owner?.displayName ?? 'Unknown',
      id: guild.ownerId,
    })
  }
}