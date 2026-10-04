import { ButtonInteraction, CacheType, InteractionCollector, Message } from 'discord.js'
import id from 'voucher-code-generator'
import { PlayerButton } from '../@types/Button.js'
import { Manager } from '../manager.js'
import { ReplyInteractionService } from '../services/ReplyInteractionService.js'
import { RainlinkPlayer } from 'rainlink'
import { Playlist } from '../database/schema/Playlist.js'

export default class implements PlayerButton {
  name = 'favourite'
  async run(
    client: Manager,
    message: ButtonInteraction<CacheType>,
    language: string,
    player: RainlinkPlayer,
    nplaying: Message<boolean>,
    collector?: InteractionCollector<ButtonInteraction<'cached'>>
  ): Promise<any> {
    if (!player && collector) return collector.stop()

    const track = player.queue.current
    if (!track)
      return new ReplyInteractionService(
        client,
        message,
        `${client.i18n.get(language, 'button.music', 'favourite_no_track')}`
      )

    const userId = message.user.id

    let playlist = (await client.db.playlist.all()).find(
      (data) => data.value.owner === userId && data.value.name === 'Favourites'
    )?.value

    if (!playlist) {
      const fullList = await client.db.playlist.all()
      const limit = fullList.filter((data) => data.value.owner === userId).length
      if (limit >= client.config.player.LIMIT_PLAYLIST)
        return new ReplyInteractionService(
          client,
          message,
          `${client.i18n.get(language, 'command.playlist', 'create_limit_playlist', {
            limit: String(client.config.player.LIMIT_PLAYLIST),
          })}`
        )

      const idgen = id.generate({ length: 8, prefix: 'playlist-' })

      playlist = await client.db.playlist.set<Playlist>(`${idgen[0]}`, {
        id: idgen[0],
        name: 'Favourites',
        owner: userId,
        tracks: [],
        private: true,
        created: Date.now(),
        description: client.i18n.get(language, 'button.music', 'favourite_description'),
      })
    }

    const exists = playlist.tracks?.some((t) => t.uri === track.uri)

    if (exists) {
      const toRemove = playlist.tracks?.find((t) => t.uri === track.uri)
      await client.db.playlist.pull(`${playlist.id}.tracks`, toRemove)
      return new ReplyInteractionService(
        client,
        message,
        `${client.i18n.get(language, 'button.music', 'favourite_removed')}`
      )
    }

    await client.db.playlist.push(`${playlist.id}.tracks`, {
      title: track.title,
      uri: track.uri,
      length: track.duration,
      thumbnail: track.artworkUrl,
      author: track.author,
      requester: message.user,
    })

    return new ReplyInteractionService(
      client,
      message,
      `${client.i18n.get(language, 'button.music', 'favourite_added')}`
    )
  }
}
