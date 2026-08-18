import { ApplicationCommandOptionType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RainlinkTrack } from 'rainlink'
import { buildV2 } from '../../../utilities/V2.js'

const TrackAdd: RainlinkTrack[] = []
const TrackExist: string[] = []
let Result: RainlinkTrack[] | null = null

export default class implements Command {
  public name = ['plqueue']
  public description = 'Save the current queue to a playlist'
  public category = 'Playlist'
  public accessableby = [Accessableby.Member]
  public usage = '<playlist_id>'
  public aliases = ['pl-sq', 'savequeue']
  public lavalink = true
  public playerCheck = true
  public usingInteraction = true
  public sameVoiceCheck = true
  public permissions = []
  public options = [
    {
      name: 'id',
      description: 'The id of the playlist',
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const value = handler.args[0] ? handler.args[0] : null

    if (value == null)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.playlist', 'invalid')}`,
          color: client.color,
        }),
      } as any)

    const playlist = await client.db.playlist.get(`${value}`)

    if (!playlist)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.playlist', 'savequeue_notfound')}`,
          color: client.color,
        }),
      } as any)
    if (playlist.owner !== handler.user?.id)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.playlist', 'savequeue_owner')}`,
          color: client.color,
        }),
      } as any)

    const player = client.rainlink.players.get(handler.guild!.id)

    const queue = player?.queue.map((track) => track)
    const current = player?.queue.current

    if (queue?.length == 0 && !current)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'noplayer', 'savequeue_no_tracks')}`,
          color: client.color,
        }),
      } as any)

    TrackAdd.push(current as RainlinkTrack)
    TrackAdd.push(...queue!)

    if (!playlist) Result = TrackAdd

    if (playlist.tracks) {
      for (let i = 0; i < playlist.tracks.length; i++) {
        const element = playlist.tracks[i].uri
        TrackExist.push(element)
      }
      Result = TrackAdd.filter((track) => !TrackExist.includes(String(track.uri)))
    }

    if (Result!.length == 0) {
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(
            handler.language,
            'command.playlist',
            'savequeue_no_new_saved',
            {
              name: value,
            }
          )}`,
          color: client.color,
        }),
      } as any)
    }

    await handler.editReply({
      flags: 32768,
      components: buildV2({
        description: `${client.i18n.get(handler.language, 'command.playlist', 'savequeue_saved', {
          name: value,
          tracks: String(queue?.length! + 1),
        })}`,
        color: client.color,
      }),
    } as any)

    Result!.forEach(async (track) => {
      await client.db.playlist.push(`${value}.tracks`, {
        title: track.title,
        uri: track.uri,
        length: track.duration,
        thumbnail: track.artworkUrl,
        author: track.author,
        requester: track.requester, // Just case can push
      })
    })

    TrackAdd.length = 0
    TrackExist.length = 0
    Result = null
  }
}
