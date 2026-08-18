import { ApplicationCommandOptionType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import EventEmitter from 'node:events'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['pldel']
  public description = 'Delete a playlist'
  public category = 'Playlist'
  public accessableby = [Accessableby.Member]
  public usage = '<playlist_id>'
  public aliases = ['delete']
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

    const playlist = await client.db.playlist.get(value)

    if (!playlist)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.playlist', 'delete_notfound')}`,
          color: client.color,
        }),
      } as any)
    if (playlist.owner !== handler.user?.id)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.playlist', 'delete_owner')}`,
          color: client.color,
        }),
      } as any)

    const msg = await handler.editReply({
      flags: 32768,
      components: buildV2({
        description: `${client.i18n.get(handler.language, 'command.playlist', 'delete_confirm', {
          playlist_id: value,
        })}`,
        color: client.color,
        buttons: [
          [
            { label: 'Yes', customId: 'yes', style: 4 },
            { label: 'No', customId: 'no', style: 2 },
          ],
        ],
      }),
    } as any)

    const collector = msg?.createMessageComponentCollector({
      filter: (m) => m.user.id == handler.user?.id,
      time: 20000,
    })

    collector?.on('collect', async (interaction) => {
      const id = interaction.customId
      if (id == 'yes') {
        await client.db.playlist.delete(value)
        interaction.reply({
          flags: 32768,
          components: buildV2({
            description: `${client.i18n.get(
              handler.language,
              'command.playlist',
              'delete_deleted',
              {
                name: value,
              }
            )}`,
            color: client.color,
          }),
        } as any)
        collector.stop()
        msg?.delete().catch(() => null)
      } else if (id == 'no') {
        interaction.reply({
          flags: 32768,
          components: buildV2({
            description: `${client.i18n.get(handler.language, 'command.playlist', 'delete_no')}`,
            color: client.color,
          }),
        } as any)
        collector.stop()
        msg?.delete().catch(() => null)
      }
    })

    collector?.on('end', async () => {
      const checkMsg = await handler.channel?.messages.fetch(String(msg?.id)).catch(() => undefined)
      checkMsg
        ? checkMsg
            .edit({
              flags: 32768,
              components: buildV2({
                description: `${client.i18n.get(handler.language, 'command.playlist', 'delete_no')}`,
                color: client.color,
              }),
            } as any)
            .catch(() => null)
        : true
      // @ts-ignore
      collector?.removeAllListeners()
    })
  }
}
