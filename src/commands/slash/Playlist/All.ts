import { ApplicationCommandOptionType } from 'discord.js'
import { PageQueue } from '../../../structures/PageQueue.js'
import humanizeDuration from 'humanize-duration'
import { Manager } from '../../../manager.js'
import { Playlist } from '../../../database/schema/Playlist.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['plall']
  public description = 'View all your playlists'
  public category = 'Playlist'
  public accessableby = [Accessableby.Member]
  public usage = '<number>'
  public aliases = ['all']
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

    const number = handler.args[0]

    const playlists: Playlist[] = []
    const fullList = await client.db.playlist.all()

    fullList
      .filter((data) => {
        return data.value.owner == handler.user?.id
      })
      .forEach((data) => {
        playlists.push(data.value)
      })

    let pagesNum = Math.ceil(playlists.length / 10)
    if (pagesNum === 0) pagesNum = 1

    const playlistStrings = []
    for (let i = 0; i < playlists.length; i++) {
      const playlist = playlists[i]
      const created = humanizeDuration(Date.now() - playlists[i].created, {
        largest: 1,
      })
      playlistStrings.push(
        `${client.i18n.get(handler.language, 'command.playlist', 'view_embed_playlist', {
          num: String(i + 1),
          name: playlist.id,
          tracks: String(playlist.tracks!.length),
          create: created,
        })}
                `
      )
    }

    const pages: any[][] = []
    for (let i = 0; i < pagesNum; i++) {
      const str = playlistStrings.slice(i * 10, i * 10 + 10).join(`\n`)
      const authorName = `${client.i18n.get(
        handler.language,
        'command.playlist',
        'view_embed_title',
        {
          user: handler.user!.username,
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
      if (pages.length == pagesNum && playlists.length > 10) {
        if (handler.message) {
          await new PageQueue(
            client,
            pages,
            30000,
            playlists.length,
            handler.language
          ).prefixPlaylistPage(handler.message)
        } else if (handler.interaction) {
          await new PageQueue(
            client,
            pages,
            30000,
            playlists.length,
            handler.language
          ).slashPlaylistPage(handler.interaction)
        }
        return (playlists.length = 0)
      } else {
        await handler.editReply({ flags: 32768, components: pages[0] } as any)
        return (playlists.length = 0)
      }
    } else {
      if (isNaN(+number))
        return handler.replyV2(
          buildV2({
            description: `${client.i18n.get(handler.language, 'command.playlist', 'view_notnumber')}`,
            color: client.color,
          })
        )
      if (Number(number) > pagesNum)
        return handler.editReply({
          content: `${client.i18n.get(handler.language, 'command.playlist', 'view_page_notfound', {
            page: String(pagesNum),
          })}`,
        })
      const pageNum = Number(number) == 0 ? 1 : Number(number) - 1
      await handler.editReply({ flags: 32768, components: pages[pageNum] } as any)
      return (playlists.length = 0)
    }
  }
}
