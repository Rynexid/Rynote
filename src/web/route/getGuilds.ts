import { Manager } from '../../manager.js'
import Fastify from 'fastify'

export async function getGuilds(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  const guilds = client.guilds.cache.map((guild) => ({
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL({ size: 1024 }),
    memberCount: guild.memberCount,
    owner: guild.ownerId,
    hasPlayer: !!client.rainlink.players.get(guild.id),
    voiceChannels: guild.channels.cache
      .filter((ch) => ch.type === 2)
      .map((ch) => ({
        id: ch.id,
        name: ch.name,
      })),
  }))

  res.send({ data: guilds })
}
