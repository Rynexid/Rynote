import { Manager } from '../../manager.js'
import Fastify from 'fastify'

export async function getGuildDetail(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  const guildId = (req.params as Record<string, string>)['guildId']

  try {
    const guild = await client.guilds.fetch(guildId)
    const player = client.rainlink.players.get(guildId)

    res.send({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ size: 1024 }),
      memberCount: guild.memberCount,
      owner: guild.ownerId,
      hasPlayer: !!player,
      player: player
        ? {
            loop: player.loop,
            paused: player.paused,
            position: player.position,
            volume: player.volume,
            current: player.queue.current
              ? {
                  title: player.queue.current.title,
                  uri: player.queue.current.uri,
                  duration: player.queue.current.duration,
                  artworkUrl: player.queue.current.artworkUrl,
                  author: player.queue.current.author,
                }
              : null,
            queueLength: player.queue.length,
          }
        : null,
      voiceChannels: guild.channels.cache
        .filter((ch) => ch.type === 2)
        .map((ch) => ({
          id: ch.id,
          name: ch.name,
          memberCount: ch.members?.size ?? 0,
        })),
    })
  } catch {
    res.code(404).send({ error: 'Guild not found' })
  }
}
