import { Manager } from '../../manager.js'
import Fastify from 'fastify'
import { User } from 'discord.js'

export async function postPlay(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  const guildId = (req.params as Record<string, string>)['guildId']
  const body = req.body as { query?: string; voiceChannelId?: string }

  if (!body?.query) {
    return res.code(400).send({ error: 'Missing query' })
  }

  if (!body?.voiceChannelId) {
    return res.code(400).send({ error: 'Missing voiceChannelId' })
  }

  const guild = await client.guilds.fetch(guildId).catch(() => null)
  if (!guild) {
    return res.code(404).send({ error: 'Guild not found' })
  }

  const voiceChannel = guild.channels.cache.get(body.voiceChannelId)
  if (!voiceChannel || voiceChannel.type !== 2) {
    return res.code(400).send({ error: 'Invalid voice channel' })
  }

  try {
    const result = await client.rainlink.search(body.query)
    if (!result.tracks.length) {
      return res.code(404).send({ error: 'No tracks found' })
    }

    const track = result.tracks[0]

    let player = client.rainlink.players.get(guildId)
    if (!player) {
      player = await client.rainlink.create({
        guildId,
        shardId: 0,
        voiceId: body.voiceChannelId,
        textId: voiceChannel.id,
        volume: client.config.player.DEFAULT_VOLUME,
      })
    }

    player.queue.add(track)

    if (!player.playing && !player.paused) {
      await player.play()
    }

    const requester = track.requester as User

    res.send({
      success: true,
      track: {
        title: track.title,
        uri: track.uri,
        duration: track.duration,
        artworkUrl: track.artworkUrl,
        author: track.author,
        requester: requester
          ? {
              id: requester.id,
              username: requester.username,
              globalName: requester.globalName,
            }
          : null,
      },
    })
  } catch (err: any) {
    client.logger.error('PostPlay', err)
    res.code(500).send({ error: err.message ?? 'Failed to play track' })
  }
}
