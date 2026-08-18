import { ApplicationCommandOptionType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['plremove']
  public description = 'Remove a song from a playlist'
  public category = 'Playlist'
  public accessableby = [Accessableby.Member]
  public usage = '<playlist_id> <song_postion>'
  public aliases = ['remove']
  public lavalink = true
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []

  public options = [
    {
      name: 'id',
      description: 'The id of the playlist',
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: 'postion',
      description: 'The position of the song',
      required: true,
      type: ApplicationCommandOptionType.Integer,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const value = handler.args[0] ? handler.args[0] : null
    const pos = handler.args[1]

    if (value == null)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.playlist', 'invalid')}`,
          color: client.color,
        }),
      } as any)

    if (pos && isNaN(+pos))
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'error', 'number_invalid')}`,
          color: client.color,
        }),
      } as any)

    const playlist = await client.db.playlist.get(`${value}`)
    if (!playlist)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.playlist', 'remove_notfound')}`,
          color: client.color,
        }),
      } as any)
    if (playlist.owner !== handler.user?.id)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.playlist', 'remove_owner')}`,
          color: client.color,
        }),
      } as any)

    const position = pos
    const song = playlist.tracks![Number(position) - 1]
    if (!song)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.playlist', 'remove_song_notfound')}`,
          color: client.color,
        }),
      } as any)
    await client.db.playlist.pull(`${value}.tracks`, playlist.tracks![Number(position) - 1])
    handler.editReply({
      flags: 32768,
      components: buildV2({
        description: `${client.i18n.get(handler.language, 'command.playlist', 'remove_removed', {
          name: value,
          position: pos,
        })}`,
        color: client.color,
      }),
    } as any)
  }
}
