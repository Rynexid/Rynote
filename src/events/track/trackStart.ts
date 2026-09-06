import { Manager } from '../../manager.js'
import { ComponentType, TextChannel, MessageFlags } from 'discord.js'
import { formatDuration } from '../../utilities/FormatDuration.js'
import { filterSelect, playerRowOne, playerRowTwo } from '../../utilities/PlayerControlButton.js'
import { AutoReconnectBuilderService } from '../../services/AutoReconnectBuilderService.js'
import { SongNotiEnum } from '../../database/schema/SongNoti.js'
import { RainlinkFilterMode, RainlinkPlayer, RainlinkTrack } from 'rainlink'
import { getTitle } from '../../utilities/GetTitle.js'
import { getSourceName } from '../../utilities/SourceName.js'
import { getArtwork } from '../../utilities/GetArtwork.js'

export default class {
  async execute(client: Manager, player: RainlinkPlayer, track: RainlinkTrack) {
    if (!client.isDatabaseConnected)
      return client.logger.warn(
        'DatabaseService',
        'The database is not yet connected so this event will temporarily not execute. Please try again later!'
      )

    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined)
    client.logger.info('TrackStart', `Track Started in @ ${guild!.name} / ${player.guildId}`)

    player.data.set('retrying', false)

    let SongNoti = await client.db.songNoti.get(`${player.guildId}`)
    if (!SongNoti) SongNoti = await client.db.songNoti.set(`${player.guildId}`, SongNotiEnum.Enable)

    if (!player) return

    /////////// Update Music Setup ///////////

    await client.UpdateQueueMsg(player)

    /////////// Update Music Setup ///////////

    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel
    if (!channel) return

    client.emit('trackStart', player)

    if (client.config.utilities.AUTO_RESUME) {
      const autoreconnect = new AutoReconnectBuilderService(client, player)
      const getData = await autoreconnect.get(player.guildId)
      if (!getData) await autoreconnect.playerBuild(player.guildId)
      else {
        player.queue.current
          ? await client.db.autoreconnect.set(
              `${player.guildId}.current`,
              player.queue.current?.uri
            )
          : true
        await client.db.autoreconnect.set(`${player.guildId}.config.loop`, player.loop)

        function queueUri() {
          const res = []
          for (let data of player.queue) {
            res.push(data.uri)
          }
          return res.length !== 0 ? res : []
        }

        function previousUri() {
          const res = []
          for (let data of player.queue.previous) {
            res.push(data.uri)
          }
          return res.length !== 0 ? res : []
        }

        await client.db.autoreconnect.set(`${player.guildId}.queue`, queueUri())
        await client.db.autoreconnect.set(`${player.guildId}.previous`, previousUri())
      }
    }

    let data = await client.db.setup.get(`${channel.guild.id}`)
    if (data && player.textId === data.channel) return

    let guildModel = await client.db.language.get(`${channel.guild.id}`)
    if (!guildModel) {
      guildModel = await client.db.language.set(`${channel.guild.id}`, client.config.bot.LANGUAGE)
    }

    const language = guildModel

    if (SongNoti == SongNotiEnum.Disable) return

    const artworkUrl = await getArtwork(track)

    const mediaItems = artworkUrl
      ? [{ type: 12, items: [{ media: { url: artworkUrl }, description: getTitle(client, track, language) }] }]
      : []

    const componentsV2 = [
      {
        type: 17,
        accent_color: client.color,
        components: [
          ...mediaItems,
          {
            type: 10,
            content: `## ${client.i18n.get(language, 'event.player', 'track_title')}\n### ${getTitle(client, track, language)}`,
          },
          { type: 14, divider: true, spacing: 1 },
          {
            type: 10,
            content:
              `- **${client.i18n.get(language, 'event.player', 'author_title')}:** ${track.author}\n` +
              `- **${client.i18n.get(language, 'event.player', 'source_title')}:** ${getSourceName(client, track, language)}\n` +
              `- **${client.i18n.get(language, 'event.player', 'duration_title')}:** ${formatDuration(track.duration)}\n` +
              `- **${client.i18n.get(language, 'event.player', 'request_title')}:** ${track.requester}`,
          },
        ],
      },
      filterSelect(client, false, language).toJSON(),
      playerRowOne(client, false).toJSON(),
      playerRowTwo(client, false).toJSON(),
    ]

    const playing_channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel

    const nplaying = playing_channel
      ? await playing_channel.send({
          flags: MessageFlags.IsComponentsV2,
          components: componentsV2,
          // files: client.config.bot.SAFE_PLAYER_MODE ? [] : [attachment],
        })
      : undefined

    if (!nplaying) return

    const collector = nplaying.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (message) => {
        if (
          message.guild!.members.me!.voice.channel &&
          message.guild!.members.me!.voice.channelId === message.member!.voice.channelId
        )
          return true
        else {
          message.reply({
            content: `${client.i18n.get(language, 'event.player', 'join_voice')}`,
            flags: MessageFlags.Ephemeral,
          })
          return false
        }
      },
    })

    const collectorFilter = nplaying.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (message) => {
        if (
          message.guild!.members.me!.voice.channel &&
          message.guild!.members.me!.voice.channelId === message.member!.voice.channelId
        )
          return true
        else {
          message.reply({
            content: `${client.i18n.get(language, 'event.player', 'join_voice')}`,
            flags: MessageFlags.Ephemeral,
          })
          return false
        }
      },
    })

    client.nplayingMsg.set(player.guildId, {
      coll: collector,
      msg: nplaying,
      filterColl: collectorFilter,
    })

    collectorFilter.on('collect', async (message): Promise<void> => {
      await message.deferUpdate().catch(() => null)

      const filterMode = message.values[0] as RainlinkFilterMode

      if (player.data.get('filter-mode') == filterMode) {
        const components = [
          {
            type: 17,
            accent_color: client.color,
            components: [
              {
                type: 10,
                content: `${client.i18n.get(language, 'button.music', 'filter_already', { name: filterMode })}`,
              },
            ],
          },
        ]
        const msg = await message
          .followUp({ flags: 32768, components, ephemeral: true } as any)
          .catch(() => {})
        if (msg)
          setTimeout(() => msg.delete().catch(() => {}), client.config.utilities.DELETE_MSG_TIMEOUT)
        return
      }

      if (filterMode == 'clear' && !player.data.get('filter-mode')) {
        const components = [
          {
            type: 17,
            accent_color: client.color,
            components: [
              {
                type: 10,
                content: `${client.i18n.get(language, 'button.music', 'reset_already')}`,
              },
            ],
          },
        ]
        const msg = await message
          .followUp({ flags: 32768, components, ephemeral: true } as any)
          .catch(() => {})
        if (msg)
          setTimeout(() => msg.delete().catch(() => {}), client.config.utilities.DELETE_MSG_TIMEOUT)
        return
      }

      filterMode == 'clear'
        ? player.data.delete('filter-mode')
        : player.data.set('filter-mode', filterMode)
      filterMode == 'clear' ? await player.filter.clear() : await player.filter.set(filterMode)

      const filterComponents = [
        {
          type: 17,
          accent_color: client.color,
          components: [
            {
              type: 10,
              content:
                filterMode == 'clear'
                  ? `${client.i18n.get(language, 'button.music', 'reset_on')}`
                  : `${client.i18n.get(language, 'button.music', 'filter_on', { name: filterMode })}`,
            },
          ],
        },
      ]

      const msg = await message
        .followUp({ flags: 32768, components: filterComponents, ephemeral: true } as any)
        .catch(() => {})
      if (msg)
        setTimeout(() => msg.delete().catch(() => {}), client.config.utilities.DELETE_MSG_TIMEOUT)
    })

    collector.on('collect', async (message): Promise<void> => {
      await message.deferUpdate().catch(() => null)

      const id = message.customId
      const button = client.plButton.get(id)

      const language = guildModel

      if (button) {
        try {
          return button.run(client, message, String(language), player, nplaying, collector)
        } catch (err) {
          client.logger.error('ButtonError', err)
        }
      }
    })

    collector.on('end', (): void => {
      // @ts-ignore
      collector.removeAllListeners()
    })

    collectorFilter.on('end', (): void => {
      // @ts-ignore
      collectorFilter.removeAllListeners()
    })
  }
}
