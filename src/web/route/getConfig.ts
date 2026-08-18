import { Manager } from '../../manager.js'
import Fastify from 'fastify'

export async function getConfig(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  res.send({
    bot: {
      name: client.user?.username ?? 'Rynote',
      id: client.user?.id ?? '',
      owner: client.owner,
    },
    player: {
      defaultVolume: client.config.player.DEFAULT_VOLUME,
      leaveTimeout: client.config.player.LEAVE_TIMEOUT,
      avoidSuspend: client.config.player.AVOID_SUSPEND,
      limitTrack: client.config.player.LIMIT_TRACK,
      limitPlaylist: client.config.player.LIMIT_PLAYLIST,
      npRealtime: client.config.player.NP_REALTIME,
      autocompleteSearch: client.config.player.AUTOCOMPLETE_SEARCH,
    },
    nodes: client.config.player.NODES.map((n) => ({
      name: n.name,
      host: n.host,
      port: n.port,
      secure: n.secure,
    })),
    spotify: {
      enabled: client.config.player.SPOTIFY.enable,
    },
  })
}
