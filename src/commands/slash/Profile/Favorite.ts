import { ApplicationCommandOptionType } from 'discord.js'
import { formatDuration } from '../../../utilities/FormatDuration.js'
import { PageQueue } from '../../../structures/PageQueue.js'
import { Manager } from '../../../manager.js'
import { PlaylistTrack } from '../../../database/schema/Playlist.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['favorite']
  public description = 'View your favourite tracks'
  public category = 'Profile'
  public accessableby = [Accessableby.Member]
  public usage = '<number>'
  public aliases = ['fav']
  public lavalink = false
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []

  public options = [
    {
      name: 'page',
      description: 'The page you want to view',
      required: false,
      type: ApplicationCommandOptionType.Integer,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const userTarget = await client.users.fetch(handler.user.id)

    const number = handler.args[0]

    const playlist = (await client.db.playlist.all()).find(
      (data) => data.value.owner === handler.user?.id && data.value.name === 'Favourites'
    )?.value

    if (!playlist || !playlist.tracks || playlist.tracks.length === 0)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.profile', 'favorite_empty')}`,
          color: client.color,
        }),
      } as any)

    let pagesNum = Math.ceil(playlist.tracks.length / 10)
    if (pagesNum === 0) pagesNum = 1

    const favouriteStrings = []
    for (let i = 0; i < playlist.tracks.length; i++) {
      const track = playlist.tracks[i]
      favouriteStrings.push(
        `${client.i18n.get(handler.language, 'command.profile', 'favorite_track', {
          num: String(i + 1),
          title: this.getTitle(client, track),
          author: String(track.author),
          duration: formatDuration(track.length),
        })}
                `
      )
    }

    const totalDuration = formatDuration(
      playlist.tracks.reduce((acc: number, cur: PlaylistTrack) => acc + cur.length!, 0)
    )

    const pages: any[][] = []
    for (let i = 0; i < pagesNum; i++) {
      const str = favouriteStrings.slice(i * 10, i * 10 + 10).join(`\n`)
      const authorName = `${client.i18n.get(
        handler.language,
        'command.profile',
        'favorite_embed_title',
        { user: userTarget.username }
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
      if (pages.length == pagesNum && playlist.tracks.length > 10) {
        return handler.interaction
          ? new PageQueue(client, pages, 30000, playlist.tracks.length, handler.language).slashPage(
              handler.interaction,
              totalDuration
            )
          : new PageQueue(
              client,
              pages,
              30000,
              playlist.tracks.length,
              handler.language
            ).prefixPage(handler.message, totalDuration)
      } else return handler.editReply({ flags: 32768, components: pages[0] } as any)
    } else {
      if (isNaN(+number))
        return handler.editReply({
          flags: 32768,
          components: buildV2({
            description: `${client.i18n.get(handler.language, 'error', 'number_invalid')}`,
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
