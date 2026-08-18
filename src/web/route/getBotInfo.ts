import { Manager } from '../../manager.js'
import Fastify from 'fastify'

export async function getBotInfo(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  const uptime = process.uptime()
  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  const seconds = Math.floor(uptime % 60)

  res.send({
    name: client.user?.username ?? 'Rynote',
    id: client.user?.id ?? '',
    avatar: client.user?.displayAvatarURL({ size: 1024 }) ?? '',
    version: require('../../../package.json').version,
    codename: require('../../../package.json').rynote?.codename ?? 'rynote',
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    uptimeMs: Math.floor(uptime * 1000),
    guilds: client.guilds.cache.size,
    users: client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0),
    channels: client.channels.cache.size,
    commands: client.commands.size,
    prefixCommands: client.prefixCommands?.size ?? 0,
    node: {
      connected: client.rainlink.nodes.size > 0,
      nodes: client.rainlink.nodes.values.map((n: any) => ({
        name: n.options?.name ?? 'unknown',
        status: n.online ? 'connected' : 'disconnected',
      })),
    },
  })
}
