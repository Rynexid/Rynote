import { ApplicationCommandOptionType } from 'discord.js'
import { formatDuration } from '../../../utilities/FormatDuration.js'
import { PageQueue } from '../../../structures/PageQueue.js'
import { Manager } from '../../../manager.js'
import { PlaylistTrack } from '../../../database/schema/Playlist.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['pldetail']
  public description = 'View all your playlists'
  public category = 'Playlist'
  public accessableby = [Accessableby.Member]
  public usage = '<playlist_id> <number>'
  public aliases = ['detail']
  public lavalink = false
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
      name: 'page',
      description: 'The page you want to view',
      required: false,
      type: ApplicationCommandOptionType.Integer,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const value = handler.args[0] ? handler.args[0] : null
    const number = handler.args[1]

    if (number && isNaN(+number))
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'error', 'number_invalid')}`,
          color: client.color,
        }),
      } as any)

    if (!value)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.playlist', 'detail_notfound')}`,
          color: client.color,
        }),
      } as any)

    const playlist = await client.db.playlist.get(value!)

    if (!playlist)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.playlist', 'detail_notfound')}`,
          color: client.color,
        }),
      } as any)
    if (playlist.private && playlist.owner !== handler.user?.id)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.playlist', 'detail_private')}`,
          color: client.color,
        }),
      } as any)

    let pagesNum = Math.ceil(playlist.tracks!.length / 10)
    if (pagesNum === 0) pagesNum = 1

    const playlistStrings = []
    for (let i = 0; i < playlist.tracks!.length; i++) {
      const playlists = playlist.tracks![i]
      playlistStrings.push(
        `${client.i18n.get(handler.language, 'command.playlist', 'detail_track', {
          num: String(i + 1),
          title: this.getTitle(client, playlists),
          author: String(playlists.author),
          duration: formatDuration(playlists.length),
        })}
                `
      )
    }

    const totalDuration = formatDuration(
      playlist.tracks!.reduce((acc: number, cur: PlaylistTrack) => acc + cur.length!, 0)
    )

    const pages: any[][] = []
    for (let i = 0; i < pagesNum; i++) {
      const str = playlistStrings.slice(i * 10, i * 10 + 10).join(`\n`)
      const authorName = `${client.i18n.get(
        handler.language,
        'command.playlist',
        'detail_embed_title',
        {
          name: playlist.name,
        }
      )}`
      const description = `${str == '' ? client.i18n.get(handler.language, 'command.music', 'nothing') : '\n' + str}`
      pages.push([
        {
          type: 17,
          accent_color: client.color,
          components: [
            { type: 10, content: `## ${authorName}` },
            { type: 10, content: description },
          ],
        },
      ])
    }
    if (!number) {
      if (pages.length == pagesNum && playlist.tracks!.length > 10) {
        if (handler.message) {
          await new PageQueue(
            client,
            pages,
            30000,
            playlist.tracks!.length,
            handler.language
          ).prefixPage(handler.message, totalDuration)
        } else if (handler.interaction) {
          await new PageQueue(
            client,
            pages,
            30000,
            playlist.tracks!.length,
            handler.language
          ).slashPage(handler.interaction, totalDuration)
        }
      } else return handler.editReply({ flags: 32768, components: pages[0] } as any)
    } else {
      if (isNaN(+number))
        return handler.editReply({
          flags: 32768,
          components: buildV2({
            description: `${client.i18n.get(handler.language, 'command.playlist', 'detail_notnumber')}`,
            color: client.color,
          }),
        } as any)
      if (Number(number) > pagesNum)
        return handler.editReply({
          flags: 32768,
          components: buildV2({
            description: `${client.i18n.get(
              handler.language,
              'command.playlist',
              'detail_page_notfound',
              {
                page: String(pagesNum),
              }
            )}`,
            color: client.color,
          }),
        } as any)
      const pageNum = Number(number) == 0 ? 1 : Number(number) - 1
      return handler.editReply({ flags: 32768, components: pages[pageNum] } as any)
    }
  }

  getTitle(client: Manager, tracks: PlaylistTrack): string {
    if (client.config.player.AVOID_SUSPEND) return String(tracks.title)
    else {
      return `[${tracks.title}](${tracks.uri})`
    }
  }
}
