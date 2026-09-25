import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
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
import { buildV2 } from '../../../utilities/V2.js'
import { getTitle } from '../../../utilities/GetTitle.js'
import { getSourceName } from '../../../utilities/SourceName.js'

export default class implements Command {
  public name = ['play']
  public description = 'Play a song from any types'
  public category = 'Music'
  public accessableby = [Accessableby.Member]
  public usage = '<name_or_url>'
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
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    let player = client.rainlink.players.get(handler.guild!.id)

    const value = handler.args.join(' ')
    const maxLength = await client.db.maxlength.get(handler.user.id)

    if (!value)
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

    if (emotes(value) !== null)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'play_emoji')}`,
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

    const result = await this.searchTrack(player, value, handler.user)
    const tracks = result.tracks.filter((e) =>
      typeof maxLength !== 'string' ? e.duration > maxLength : e
    )

    if (!result.tracks.length)
      return handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'play_match')}`,
          color: client.color,
        })
      )
    if (result.type === 'PLAYLIST') for (let track of tracks) player.queue.add(track)
    else if (player.playing && result.type === 'SEARCH') player.queue.add(tracks[0])
    else if (player.playing && result.type !== 'SEARCH')
      for (let track of tracks) player.queue.add(track)
    else player.queue.add(tracks[0])

    const TotalDuration = player.queue.duration

    if (handler.message) await handler.message.delete().catch(() => null)

    if (!player.playing) player.play()

    if (result.type === 'PLAYLIST') {
      await handler.replyV2(
        buildV2({
          description: `${client.i18n.get(handler.language, 'command.music', 'play_playlist', {
            title: this.getTitle(client, result, tracks, handler.language),
            duration: convertTime(TotalDuration),
            request: String(tracks[0].requester),
            count: String(tracks.length),
          })}`,
          color: client.color,
        })
      )
      return
    }

    const track = tracks[0]

    await handler.replyV2(
      buildV2({
        description: `${client.i18n.get(
          handler.language,
          'command.music',
          result.type === 'SEARCH' ? 'play_search' : 'play_track',
          {
            title: this.getTitle(client, result, tracks, handler.language),
            duration: convertTime(track.duration as number),
            source: getSourceName(client, track, handler.language),
            request: String(track.requester),
          }
        )}`,
        color: client.color,
      })
    )
  }

  private async searchTrack(
    player: RainlinkPlayer,
    value: string,
    requester: any
  ): Promise<RainlinkSearchResult> {
    let result = await player.search(value, { requester }).catch(() => null)
    for (let i = 0; (!result || result.tracks.length === 0) && i < 2; i++) {
      await new Promise((r) => setTimeout(r, 1500))
      result = await player.search(value, { requester }).catch(() => null)
    }
    if ((!result || result.tracks.length === 0) && !/^https?:\/\//.test(value)) {
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
