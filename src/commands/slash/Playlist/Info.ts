import { ApplicationCommandOptionType, Message } from 'discord.js'
import humanizeDuration from 'humanize-duration'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['plinfo']
  public description = 'Check the playlist infomation'
  public category = 'Playlist'
  public accessableby = [Accessableby.Member]
  public usage = '<playlist_id>'
  public aliases = ['info']
  public lavalink = true
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []

  public options = [
    {
      name: 'id',
      description: 'The id of the playlist',
      type: ApplicationCommandOptionType.String,
      required: true,
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

    const info = await client.db.playlist.get(value)

    if (!info)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.playlist', 'invalid')}`,
          color: client.color,
        }),
      } as any)

    const created = humanizeDuration(Date.now() - Number(info.created), {
      largest: 1,
    })

    const name = await client.users.fetch(info.owner)

    handler.editReply({
      flags: 32768,
      components: buildV2({
        title: info.name,
        fields: [
          {
            name: `${client.i18n.get(handler.language, 'command.playlist', 'info_owner')}`,
            value: `${name.username}`,
          },
          {
            name: `${client.i18n.get(handler.language, 'command.playlist', 'info_id')}`,
            value: `${info.id}`,
          },
          {
            name: `${client.i18n.get(handler.language, 'command.playlist', 'info_des')}`,
            value: `${
              info.description === null || info.description === 'null'
                ? client.i18n.get(handler.language, 'command.playlist', 'no_des')
                : info.description
            }`,
          },
          {
            name: `${client.i18n.get(handler.language, 'command.playlist', 'info_private')}`,
            value: `${
              info.private
                ? client.i18n.get(handler.language, 'command.playlist', 'public')
                : client.i18n.get(handler.language, 'command.playlist', 'private')
            }`,
          },
          {
            name: `${client.i18n.get(handler.language, 'command.playlist', 'info_created')}`,
            value: `${created}`,
          },
          {
            name: `${client.i18n.get(handler.language, 'command.playlist', 'info_total')}`,
            value: `${info.tracks!.length}`,
          },
        ],
        color: client.color,
      }),
    } as any)
  }
}
