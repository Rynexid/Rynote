import { ApplicationCommandOptionType, ChannelType } from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { filterSelect, playerRowOne, playerRowTwo } from '../../../utilities/PlayerControlButton.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['setup']
  public description = 'Setup channel song request'
  public category = 'Utils'
  public accessableby = [Accessableby.Manager]
  public usage = '<create> or <delete>'
  public aliases = ['setup']
  public lavalink = false
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []

  options = [
    {
      name: 'type',
      description: 'Type of channel',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: 'Create',
          value: 'create',
        },
        {
          name: 'Delete',
          value: 'delete',
        },
      ],
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()
    let option = ['create', 'delete']

    if (!handler.args[0] || !option.includes(handler.args[0]))
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'error', 'arg_error', {
            text: '**create** or **delete**!',
          })}`,
          color: client.color,
        }),
      } as any)

    const value = handler.args[0]

    if (value === 'create') {
      const SetupChannel = await client.db.setup.get(`${handler.guild!.id}`)

      if (SetupChannel && SetupChannel!.enable == true)
        return handler.editReply({
          flags: 32768,
          components: buildV2({
            description: `${client.i18n.get(handler.language, 'command.utils', 'setup_enable')}`,
            color: client.color,
          }),
        } as any)

      const parent = await handler.guild!.channels.create({
        name: `${client.user!.username}'s Music`,
        type: ChannelType.GuildCategory,
      })
      const textChannel = await handler.guild!.channels.create({
        name: 'song-request',
        type: ChannelType.GuildText,
        topic: `${client.i18n.get(handler.language, 'command.utils', 'setup_topic')}`,
        parent: parent.id,
      })
      const queueMsg = `${client.i18n.get(handler.language, 'event.setup', 'setup_queuemsg')}`

      const playContainer = {
        type: 17,
        accent_color: client.color,
        components: [
          { type: 10, content: queueMsg },
          {
            type: 12,
            items: [
              {
                media: {
                  url: `https://cdn.discordapp.com/avatars/${client.user!.id}/${client.user!.avatar}.jpeg?size=300`,
                },
                description: client.i18n.get(
                  handler.language,
                  'event.setup',
                  'setup_playembed_author'
                ),
              },
            ],
          },
        ],
      }

      const channel_msg = await textChannel.send({
        flags: 32768,
        components: [
          playContainer,
          filterSelect(client, true, handler.language),
          playerRowOne(client, true),
          playerRowTwo(client, true),
        ] as any,
      })

      const voiceChannel = await handler.guild!.channels.create({
        name: `${client.user!.username}`,
        type: ChannelType.GuildVoice,
        parent: parent.id,
        userLimit: 99,
      })

      const new_data = {
        guild: handler.guild!.id,
        enable: true,
        channel: textChannel.id,
        playmsg: channel_msg.id,
        voice: voiceChannel.id,
        category: parent.id,
      }

      await client.db.setup.set(`${handler.guild!.id}`, new_data)

      return handler.editReply({
        flags: 32768,
        components: buildV2({
          description: `${client.i18n.get(handler.language, 'command.utils', 'setup_msg', {
            channel: String(textChannel),
          })}`,
          color: client.color,
        }),
      } as any)
    } else if (value === 'delete') {
      const SetupChannel = await client.db.setup.get(`${handler.guild!.id}`)

      const embed_none = buildV2({
        description: `${client.i18n.get(handler.language, 'command.utils', 'setup_null')}`,
        color: client.color,
      })

      if (SetupChannel == null)
        return handler.editReply({ flags: 32768, components: embed_none } as any as any)
      if (SetupChannel.enable == false)
        return handler.editReply({ flags: 32768, components: embed_none } as any as any)

      const fetchedTextChannel = SetupChannel.channel
        ? await handler.guild!.channels.fetch(SetupChannel.channel).catch(() => {})
        : undefined
      const fetchedVoiceChannel = SetupChannel.voice
        ? await handler.guild!.channels.fetch(SetupChannel.voice).catch(() => {})
        : undefined
      const fetchedCategory = SetupChannel.category
        ? await handler.guild!.channels.fetch(SetupChannel.category).catch(() => {})
        : undefined

      const embed = buildV2({
        description: `${client.i18n.get(handler.language, 'command.utils', 'setup_deleted', {
          channel: String(fetchedTextChannel),
        })}`,
        color: client.color,
      })

      if (fetchedCategory) await fetchedCategory.delete().catch(() => null)
      if (fetchedVoiceChannel) await fetchedVoiceChannel.delete().catch(() => null)
      if (fetchedTextChannel) await fetchedTextChannel.delete().catch(() => null)

      await client.db.setup.delete(`${handler.guild!.id}`)

      if (!fetchedCategory || !fetchedTextChannel || !fetchedVoiceChannel) {
        return handler.editReply({
          flags: 32768,
          components: buildV2({
            description: `${client.i18n.get(handler.language, 'command.utils', 'setup_null')}`,
            color: client.color,
          }),
        } as any)
      }

      return handler.editReply({ flags: 32768, components: embed } as any as any)
    }
  }
}
