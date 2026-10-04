import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ComponentType,
  Message,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { convertTime } from '../../../utilities/ConvertTime.js'
import { Manager } from '../../../manager.js'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import {
  RainlinkPlayer,
  RainlinkSearchResult,
  RainlinkSearchResultType,
  RainlinkTrack,
} from 'rainlink'
import { buildV2, V2Data } from '../../../utilities/V2.js'
import { emoji } from '../../../utilities/EmojiMap.js'
import { GlobalInteraction } from '../../../@types/Interaction.js'

const SOURCE_ALIASES: Record<string, string> = {
  yt: 'youtube',
  youtube: 'youtube',
  sp: 'spotify',
  spotify: 'spotify',
  am: 'apple',
  apple: 'apple',
  applemusic: 'apple',
  sc: 'soundcloud',
  soundcloud: 'soundcloud',
  dz: 'deezer',
  deezer: 'deezer',
}

const SOURCE_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  spotify: 'Spotify',
  apple: 'Apple Music',
  soundcloud: 'SoundCloud',
  deezer: 'Deezer',
}

export default class implements Command {
  public name = ['play']
  public description = 'Play a song from any types'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = '<name_or_url> [--src yt/sp/am/sc/dz] [--pos <position>]'
  public aliases = ['p', 'pl', 'pp']
  public lavalink = true
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'search',
      description: 'The song link or name',
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
    {
      name: 'position',
      description: 'Position in queue to add the song (1 = next)',
      type: ApplicationCommandOptionType.Integer,
      required: false,
      min_value: 1,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const interact = handler.interaction as ChatInputCommandInteraction | null
    const { query, source, position } = this.resolveInput(
      interact,
      handler.args,
      client,
      handler.language
    )

    const maxLength = await client.db.maxlength.get(handler.user.id)

    if (!query)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'play_arg')}`,
          color: client.color,
        })
      )

    const { channel } = handler.member!.voice
    if (!channel)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'error', 'no_in_voice')}`,
          color: client.color,
        })
      )

    const emotes = (str: string) => str.match(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu)

    if (emotes(query) !== null)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'play_emoji')}`,
          color: client.color,
        })
      )

    const isUrl = this.isUrl(query)

    if (!isUrl && !source && this.isPrefixOnly(handler)) {
      const replyMsg = (await handler.replyV2(
        this.buildLoadingCard(client, handler, query)
      )) as Message

      const searchResult = await client.rainlink
        .search(query, { requester: handler.user, engine: 'youtube' })
        .catch(() => null)

      const tracks = searchResult?.tracks ?? []

      if (!tracks.length) {
        await this.editV2(client, handler, replyMsg, {
          description: `${emoji.get('cross')} ${client.i18n.get(
            handler.language,
            'command.music',
            'play_match'
          )}`,
          color: client.color,
        })
        return
      }

      const select = new StringSelectMenuBuilder()
        .setCustomId(`track_pick_${handler.guild!.id}_${handler.user.id}`)
        .setPlaceholder(client.i18n.get(handler.language, 'command.music', 'play_source_choose'))
        .addOptions(
          tracks.slice(0, 10).map((track) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(`${track.title} - ${track.author}`.substring(0, 100))
              .setDescription(this.formatDuration(track.duration as number))
              .setValue(track.uri ?? track.title)
          )
        )

      const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)

      const card = buildV2({
        title: `${emoji.get('music')} ${client.i18n.get(
          handler.language,
          'command.music',
          'play_source_title'
        )}`,
        color: client.color,
        sections: [
          {
            content: `${emoji.get('info')} ${client.i18n.get(
              handler.language,
              'command.music',
              'play_source_query',
              { query: this.truncate(query) }
            )}\n\n*${client.i18n.get(handler.language, 'command.music', 'play_source_hint')}*`,
          },
        ],
      })[0]
      card.components.push(selectRow.toJSON())

      await replyMsg.edit({
        flags: MessageFlags.IsComponentsV2,
        components: [card],
      } as any)

      this.setupTrackPickCollector({
        client,
        handler,
        message: replyMsg,
        tracks,
        position,
      })
      return
    }

    const loadingMsg = (await handler.replyV2(
      this.buildLoadingCard(client, handler, query)
    )) as Message

    let player = client.rainlink.players.get(handler.guild!.id)

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

    const result = await this.searchTrack(player, query, handler.user, isUrl, source)

    if (handler.message) await handler.message.delete().catch(() => null)

    await this.updateLoadingToResult(
      client,
      handler,
      loadingMsg,
      player,
      result,
      maxLength,
      position
    )
  }

  async autocomplete(client: Manager, interaction: GlobalInteraction, language: string) {
    let choice: { name: string; value: string }[] = []
    const value = String((interaction as ChatInputCommandInteraction).options.get('search')!.value)

    const maxLength = await client.db.maxlength.get((interaction as any).user.id)

    if (this.isUrl(value)) {
      choice.push({ name: `🔗 ${value.substring(0, 90)}${value.length > 90 ? '...' : ''}`, value })
      await (interaction as AutocompleteInteraction).respond(choice).catch(() => {})
      return
    }

    if (!value || value.length < 2) {
      await (interaction as AutocompleteInteraction)
        .respond([{ name: '🔍 Type to search for music...', value: ' ' }])
        .catch(() => {})
      return
    }

    if (client.lavalinkUsing.length == 0) {
      choice.push({
        name: `${client.i18n.get(language, 'command.music', 'no_node')}`,
        value: `${client.i18n.get(language, 'command.music', 'no_node')}`,
      })
      await (interaction as AutocompleteInteraction).respond(choice).catch(() => {})
      return
    }

    const [ytResult, spResult] = await Promise.allSettled([
      client.rainlink.search(value, { requester: (interaction as any).user, engine: 'youtube' }),
      client.rainlink.search(value, { requester: (interaction as any).user, engine: 'spotify' }),
    ])
    const results = {
      youtube: ytResult.status === 'fulfilled' ? ytResult.value.tracks[0] : undefined,
      spotify: spResult.status === 'fulfilled' ? spResult.value.tracks[0] : undefined,
    }

    if (!results.youtube && !results.spotify) {
      choice.push({ name: `❌ No results found for "${value}"`, value })
    }

    const seen = new Set<string>()
    const pushTrack = (track: RainlinkTrack, engine: string) => {
      const title = this.truncate(track.title, 80)
      const author = track.author ? ` - ${track.author}` : ''
      const duration = this.formatDuration(track.duration as number)
      const name = `${SOURCE_LABELS[engine]} | ${title}${author} (${duration})`
      const trackValue = track.uri || value
      if (!seen.has(name)) {
        seen.add(name)
        choice.push({ name, value: trackValue })
      }
    }

    if (results.youtube) pushTrack(results.youtube, 'youtube')
    if (results.spotify) pushTrack(results.spotify, 'spotify')

    await (interaction as AutocompleteInteraction).respond(choice.slice(0, 25)).catch(() => {})
  }

  private isPrefixOnly(handler: CommandHandler) {
    return !handler.interaction
  }

  private resolveInput(
    interact: ChatInputCommandInteraction | null,
    args: string[],
    client: Manager,
    language: string
  ) {
    if (interact) {
      const query = interact.options.getString('search') ?? ''
      const isUrl = this.isUrl(query)
      return {
        query,
        source: isUrl ? null : Math.random() < 0.5 ? 'youtube' : 'spotify',
        position: interact.options.getInteger('position') ?? null,
      }
    }
    const { query, source, position } = this.parseFlags(args)
    return { query, source, position }
  }

  private parseFlags(args: string[]) {
    const flags: { query: string[]; source: string | null; position: number | null } = {
      query: [],
      source: null,
      position: null,
    }
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (arg === '--src' || arg === '--source') {
        if (i + 1 < args.length) flags.source = args[++i]
      } else if (arg === '--pos' || arg === '--position') {
        if (i + 1 < args.length) {
          const pos = parseInt(args[++i], 10)
          if (!isNaN(pos) && pos > 0) flags.position = pos
        }
      } else if (!arg.startsWith('--')) {
        flags.query.push(arg)
      }
    }
    return {
      query: flags.query.join(' '),
      source: flags.source ? this.normalizeSource(flags.source) : null,
      position: flags.position,
    }
  }

  private normalizeSource(source: string) {
    return SOURCE_ALIASES[source.toLowerCase()] || 'youtube'
  }

  private isUrl(string: string) {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  private truncate(title: string, maxLen = 55) {
    return title.length > maxLen ? title.substring(0, maxLen - 3) + '...' : title
  }

  private formatDuration(ms: number) {
    if (!ms || ms < 0) return 'Live'
    const seconds = Math.floor((ms / 1000) % 60)
      .toString()
      .padStart(2, '0')
    const minutes = Math.floor((ms / (1000 * 60)) % 60)
      .toString()
      .padStart(2, '0')
    const hours = Math.floor(ms / (1000 * 60 * 60))
    if (hours > 0) return `${hours}:${minutes}:${seconds}`
    return `${minutes}:${seconds}`
  }

  private exceedsMaxLength(durationMs: number, maxLength: unknown) {
    if (typeof maxLength !== 'number' || maxLength <= 0) return false
    return durationMs > maxLength * 1000
  }

  private buildLoadingCard(client: Manager, handler: CommandHandler, query: string) {
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.music', key, args)

    return buildV2({
      title: `${emoji.get('loading')} ${L('play_loading_title')}`,
      color: client.color,
      description:
        `${L('play_loading_searching')}\n\n` +
        `${emoji.get('music')} **${L('play_query_label')}:** ${this.truncate(query)}\n` +
        `${emoji.get('folder')} **${L('play_sources_label')}:** ${SOURCE_LABELS.youtube}\n` +
        `${emoji.get('info')} **${L('play_status_label')}:** ${L('play_loading_processing')}\n\n` +
        `*${L('play_loading_wait')}*`,
    })
  }

  private setupTrackPickCollector(options: {
    client: Manager
    handler: CommandHandler
    message: Message
    tracks: RainlinkTrack[]
    position: number | null
  }) {
    const { client, handler, message, tracks, position } = options
    const userId = handler.user.id
    const guildId = handler.guild!.id

    const filter = (i: any) =>
      i.user.id === userId && i.customId === `track_pick_${guildId}_${userId}`

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter,
      time: 60_000,
      max: 1,
    })

    collector.on('collect', async (interaction) => {
      try {
        await interaction.deferUpdate()

        const uri = interaction.values[0]
        const track = tracks.find((t) => t.uri === uri || t.title === uri)
        if (!track) return

        await this.editV2(client, handler, message, {
          title: `${emoji.get('loading')} ${client.i18n.get(
            handler.language,
            'command.music',
            'play_loading_title'
          )}`,
          color: client.color,
          description: `*${client.i18n.get(handler.language, 'command.music', 'play_loading_wait')}*`,
        })

        let player = client.rainlink.players.get(guildId)
        if (!player)
          player = await client.rainlink.create({
            guildId,
            voiceId: handler.member!.voice.channel!.id,
            textId: handler.channel!.id,
            shardId: handler.guild?.shardId ?? 0,
            deaf: true,
            volume: client.config.player.DEFAULT_VOLUME,
          })

        player.textId = handler.channel!.id

        if (handler.message) await handler.message.delete().catch(() => null)

        const maxLength = await client.db.maxlength.get(handler.user.id)
        await this.updateLoadingToResult(
          client,
          handler,
          message,
          player,
          {
            playlistName: undefined,
            tracks: [track],
            type: RainlinkSearchResultType.SEARCH,
          },
          maxLength,
          position
        )
      } catch (err) {
        client.logger.error('PlayCommand', `Track pick error: ${(err as Error).message}`)
      }
    })

    collector.on('end', async (collected, reason) => {
      if (reason === 'time' && collected.size === 0) {
        await this.editV2(client, handler, message, {
          description: `${emoji.get('cross')} ${client.i18n.get(
            handler.language,
            'command.music',
            'play_source_timeout'
          )}`,
          color: client.color,
        })
      }
    })
  }

  private addToQueue(player: RainlinkPlayer, track: RainlinkTrack, position: number | null) {
    const insertAt = position !== null ? position - 1 : player.queue.length
    player.queue.splice(insertAt, 0, track)
  }

  private queuePosition(player: RainlinkPlayer, track: RainlinkTrack) {
    const index = player.queue.indexOf(track)
    return index === -1 ? player.queue.length : index + 1
  }

  private async editV2(client: Manager, handler: CommandHandler, message: Message, data: V2Data) {
    await message
      .edit({
        flags: MessageFlags.IsComponentsV2,
        components: buildV2({ ...data, color: data.color ?? client.color }),
      } as any)
      .catch(() => null)
  }

  private async updateLoadingToResult(
    client: Manager,
    handler: CommandHandler,
    loadingMsg: Message,
    player: RainlinkPlayer,
    result: RainlinkSearchResult,
    maxLength: any,
    position: number | null
  ) {
    const tracks = result.tracks.filter(
      (e) => !this.exceedsMaxLength(e.duration as number, maxLength)
    )

    if (!result.tracks.length) {
      await this.editV2(client, handler, loadingMsg, {
        description: `${emoji.get('cross')} ${client.i18n.get(
          handler.language,
          'command.music',
          'play_match'
        )}`,
        color: client.color,
      })
      return
    }

    const isNew = !player.playing && player.queue.isEmpty

    if (result.type === 'PLAYLIST') {
      for (let i = 0; i < tracks.length; i++)
        this.addToQueue(player, tracks[i], position ? position + i : null)
    } else {
      this.addToQueue(player, tracks[0], position)
    }

    if (!player.playing) player.play()

    const track = tracks[0]

    if (result.type === 'PLAYLIST') {
      await this.editV2(client, handler, loadingMsg, {
        title: `${emoji.get('folder')} ${client.i18n.get(
          handler.language,
          'command.music',
          'play_now_playing'
        )}`,
        color: client.color,
        sections: [
          {
            content:
              `**${client.i18n.get(handler.language, 'command.music', 'play_playlist_header')}**\n\n` +
              `├─ **${emoji.get('check')} ${client.i18n.get(handler.language, 'command.music', 'play_name_label')}:** ${result.playlistName ?? client.i18n.get(handler.language, 'command.music', 'play_source_unknown')}\n` +
              `├─ **${emoji.get('add')} ${client.i18n.get(handler.language, 'command.music', 'play_tracks_added')}:** ${tracks.length}\n` +
              `├─ **${emoji.get('info')} ${client.i18n.get(handler.language, 'command.music', 'play_duration_label')}:** ${convertTime(player.queue.duration)}\n` +
              `└─ **${emoji.get('check')} ${client.i18n.get(handler.language, 'command.music', 'play_status_label')}:** ${client.i18n.get(handler.language, 'command.music', 'play_now_playing')}`,
            thumbnail: track?.artworkUrl || undefined,
          },
        ],
      })
      return
    }

    await this.editV2(client, handler, loadingMsg, {
      title: `${emoji.get('music')} ${
        isNew
          ? client.i18n.get(handler.language, 'command.music', 'play_now_playing')
          : client.i18n.get(handler.language, 'command.music', 'play_added_to_queue')
      }`,
      color: client.color,
      sections: [
        {
          content:
            `**${client.i18n.get(handler.language, 'command.music', 'play_track_header')}**\n\n` +
            `├─ **${emoji.get('check')} ${client.i18n.get(handler.language, 'command.music', 'play_track_label')}:** ${this.getTitle(client, result, tracks, handler.language)}\n` +
            `├─ **${emoji.get('folder')} ${client.i18n.get(handler.language, 'command.music', 'play_artist_label')}:** ${track.author || 'Unknown'}\n` +
            `├─ **${emoji.get('info')} ${client.i18n.get(handler.language, 'command.music', 'play_duration_label')}:** ${convertTime(track.duration as number)}\n` +
            `└─ **${emoji.get('add')} ${client.i18n.get(handler.language, 'command.music', 'play_status_label')}:** ${client.i18n.get(
              handler.language,
              'command.music',
              'play_now_playing'
            )}\n\n` +
            `*${client.i18n.get(handler.language, 'command.music', 'play_footer_playing')}*`,
          thumbnail: track.artworkUrl || undefined,
        },
      ],
    })
  }

  private async searchTrack(
    player: RainlinkPlayer,
    value: string,
    requester: any,
    isUrl: boolean,
    source: string | null
  ): Promise<RainlinkSearchResult> {
    const engine = isUrl ? null : source
    let result = await player
      .search(value, engine ? { requester, engine } : { requester })
      .catch(() => null)
    for (let i = 0; (!result || result.tracks.length === 0) && i < 2; i++) {
      await new Promise((r) => setTimeout(r, 1500))
      result = await player
        .search(value, engine ? { requester, engine } : { requester })
        .catch(() => null)
    }
    if ((!result || result.tracks.length === 0) && !isUrl) {
      result = await player
        .search(`directSearch=scsearch:${value}`, { requester })
        .catch(() => null)
    }
    if (!result)
      return {
        playlistName: undefined,
        tracks: [],
        type: RainlinkSearchResultType.SEARCH,
      }
    return result
  }

  getTitle(
    client: Manager,
    result: { type: RainlinkSearchResultType; playlistName?: string },
    tracks: RainlinkTrack[],
    language: string
  ) {
    if (result.type === 'PLAYLIST')
      return client.i18n.get(language, 'command.music', 'playlist_name', {
        name: result.playlistName ?? client.i18n.get(language, 'command.music', 'unknown'),
        count: String(tracks.length),
      })
    return tracks[0].title
  }

  checkSameVoice(client: Manager, handler: CommandHandler, language: string) {
    const player = client.rainlink.players.get(handler.guild!.id)
    if (!player) return true

    const voiceChannel = handler.member!.voice.channel
    if (!voiceChannel) {
      handler.replyV2(
        buildV2({
          description: `${client.i18n.get(language, 'error', 'no_in_voice')}`,
          color: client.color,
        })
      )
      return false
    }

    if (player.voiceId !== voiceChannel.id) {
      handler.replyV2(
        buildV2({
          description: `${client.i18n.get(language, 'error', 'no_same_voice')}`,
          color: client.color,
        })
      )
      return false
    }
    return true
  }
}
