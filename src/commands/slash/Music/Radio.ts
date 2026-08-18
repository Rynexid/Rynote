import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ComponentType,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { RadioStationNewInterface, RadioStationArray } from '../../../utilities/RadioStations.js'
import { RainlinkSearchResultType, RainlinkTrack } from 'rainlink'
import { convertTime } from '../../../utilities/ConvertTime.js'
import { buildV2 } from '../../../utilities/V2.js'

// Main code
export default class implements Command {
  public name = ['radio']
  public description = 'Play radio in voice channel'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = '<radio_number>'
  public aliases = ['ra']
  public lavalink = false
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'number',
      description: 'The number of radio to choose the radio station',
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    let player = client.rainlink.players.get(handler.guild!.id)
    const radioList = RadioStationNewInterface()
    const radioArrayList = RadioStationArray()
    const radioListKeys = Object.keys(radioList)

    const getNum = handler.args[0] ? Number(handler.args[0]) : undefined
    if (!getNum) return this.sendHelp(client, handler, radioList, radioListKeys)

    const radioData = radioArrayList[getNum - 1]
    if (!radioData) return this.sendHelp(client, handler, radioList, radioListKeys)

    const { channel } = handler.member!.voice
    if (!channel)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'error', 'no_in_voice')}`,
          color: client.color,
        })
      )

    if (!player)
      player = await client.rainlink.create({
        guildId: handler.guild!.id,
        voiceId: handler.member!.voice.channel!.id,
        textId: handler.channel!.id,
        shardId: handler.guild?.shardId ?? 0,
        deaf: true,
        volume: client.config.player.DEFAULT_VOLUME,
      })
    else if (player && !this.checkSameVoice(client, handler, handler.language)) {
      return
    }

    player.textId = handler.channel!.id

    const result = await player.search(radioData.link, { requester: handler.user })

    if (!result.tracks.length)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'play_match')}`,
          color: client.color,
        })
      )
    if (result.type === 'PLAYLIST') for (let track of result.tracks) player.queue.add(track)
    else if (player.playing && result.type === 'SEARCH') player.queue.add(result.tracks[0])
    else if (player.playing && result.type !== 'SEARCH')
      for (let track of result.tracks) player.queue.add(track)
    else player.queue.add(result.tracks[0])

    if (handler.message) await handler.message.delete().catch(() => null)

    if (!player.playing) player.play()
    const embed = {
      description: client.i18n.get(handler.language, 'command.music', 'radio_accept', {
        radio_no: String(radioData.no),
        radio_name: radioData.name,
        radio_link: radioData.link,
      }),
      color: client.color,
    }

    handler.replyV2(buildV2(embed))
  }

  protected async sendHelp(
    client: Manager,
    handler: CommandHandler,
    radioList: Record<string, { no: number; name: string; link: string }[]>,
    radioListKeys: string[]
  ) {
    await handler.deferReply()

    const pages: any[][] = []
    for (let i = 0; i < radioListKeys.length; i++) {
      const radioListKey = radioListKeys[i]
      const stringArray = radioList[radioListKey]
      const converted = this.stringConverter(stringArray)

      const fieldsText = converted.map((f: any) => `### ${f.name}\n${f.value}`).join('\n\n')

      const page = [
        {
          type: 17,
          accent_color: client.color,
          components: [
            {
              type: 10,
              content: `## ${client.i18n.get(handler.language, 'command.music', 'radio_list_author', { host: radioListKey })}`,
            },
            { type: 10, content: fieldsText },
          ],
        },
      ]

      pages.push(page)
    }

    const providerSelector = (disable: boolean) =>
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('provider')
          .setPlaceholder(
            client.i18n.get(handler.language, 'command.music', 'radio_list_placeholder')
          )
          .addOptions(this.getOptionBuilder(radioListKeys))
          .setDisabled(disable)
      )

    const msg = await handler.editReply({
      flags: 32768,
      components: [...pages[0], providerSelector(false)] as any,
    } as any)

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 45000,
    })

    collector.on('collect', async (message): Promise<void> => {
      const providerId = Number(message.values[0])
      const providerName = radioListKeys[providerId]
      await msg.edit({
        flags: 32768,
        components: [...pages[providerId], providerSelector(false)] as any,
      })

      const moveComponents = buildV2({
        description: client.i18n.get(handler.language, 'command.music', 'radio_list_move', {
          providerName,
        }),
        color: client.color,
      })

      const msgReply = await message
        .reply({
          flags: MessageFlags.Ephemeral,
          components: moveComponents as any,
        })
        .catch(() => {})
      if (msgReply)
        setTimeout(
          () => msgReply.delete().catch(() => {}),
          client.config.utilities.DELETE_MSG_TIMEOUT
        )
    })

    collector.on('end', async () => {
      // @ts-ignore
      collector.removeAllListeners()
      await msg.edit({
        flags: 32768,
        components: [...pages[0], providerSelector(true)] as any,
      })
    })
  }

  protected getOptionBuilder(radioListKeys: string[]) {
    const result = []
    for (let i = 0; i < radioListKeys.length; i++) {
      const key = radioListKeys[i]
      result.push(new StringSelectMenuOptionBuilder().setLabel(key).setValue(String(i)))
    }
    return result
  }

  protected stringConverter(array: { no: number; name: string; link: string }[]) {
    const radioStrings = []
    for (let i = 0; i < array.length; i++) {
      const radio = array[i]
      radioStrings.push({
        name: `**${String(radio.no).padEnd(3)}** ${radio.name}`,
        value: ' ',
        inline: true,
      })
    }
    return radioStrings
  }

  checkSameVoice(client: Manager, handler: CommandHandler, language: string) {
    if (handler.member!.voice.channel !== handler.guild!.members.me!.voice.channel) {
      handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'error', 'no_same_voice')}`,
          color: client.color,
        })
      )
      return false
    }

    return true
  }

  getTitle(
    client: Manager,
    type: RainlinkSearchResultType,
    tracks: RainlinkTrack[],
    value?: string
  ): string {
    if (client.config.player.AVOID_SUSPEND) return tracks[0].title
    else {
      if (type === 'PLAYLIST') {
        return `[${tracks[0].title}](${value})`
      } else {
        return `[${tracks[0].title}](${tracks[0].uri})`
      }
    }
  }
}
