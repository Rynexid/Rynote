import { TextChannel } from 'discord.js'
import { Manager } from '../../manager.js'
import { AutoReconnectBuilderService } from '../../services/AutoReconnectBuilderService.js'
import { ClearMessageService } from '../../services/ClearMessageService.js'
import { RainlinkPlayer, RainlinkQueue } from 'rainlink'
import { buildV2 } from '../../utilities/V2.js'

export default class {
  async execute(client: Manager, player: RainlinkPlayer, queue: RainlinkQueue) {
    if (!player) return

    if (!client.isDatabaseConnected)
      return client.logger.warn(
        'DatabaseService',
        'The database is not yet connected so this event will temporarily not execute. Please try again later!'
      )

    void queue

    const clearMessage = async () => {
      const npReload = client.nowPlaying.get(`${player.guildId}`)
      if (npReload) {
        clearInterval(npReload.interval)
        client.nowPlaying.delete(`${player.guildId}`)
      }

      const nplayingMsg = client.nplayingMsg.get(player.guildId)
      if (nplayingMsg) {
        nplayingMsg.coll.stop()
        nplayingMsg.filterColl.stop()
        nplayingMsg.msg.delete().catch(() => null)
        client.nplayingMsg.delete(player.guildId)
      }
    }

    await clearMessage()

    const textChannel = (await client.channels.fetch(player.textId).catch(() => undefined)) as
      TextChannel | undefined

    const retrying = player.data.get('retrying')
    if (retrying) return

    /////////// Autoplay ///////////
    if (player.data.get('autoplay') === true) {
      const played = await this.autoplay(client, player)

      if (played) {
        if (textChannel) return new ClearMessageService(client, textChannel, player)
        return
      }

      player.data.set('autoplay', false)

      if (textChannel) {
        let language = await client.db.language.get(`${player.guildId}`)
        if (!language) language = client.config.bot.LANGUAGE

        await textChannel
          .send({
            flags: 32768,
            components: buildV2({
              description: client.i18n.get(language, 'event.player', 'autoplay_disabled'),
              color: client.color,
            }),
          } as any)
          .catch(() => null)
      }
    }
    /////////// Autoplay ///////////

    await client.UpdateMusic(player).catch(() => null)

    const data = await new AutoReconnectBuilderService(client, player).get(player.guildId)
    if (data && data.twentyfourseven) {
      if (textChannel) return new ClearMessageService(client, textChannel, player)
      return
    }

    await player.destroy().catch(() => null)

    client.liveActivity?.refresh()
  }

  protected async autoplay(client: Manager, player: RainlinkPlayer) {
    const author = player.data.get('author')
    const title = player.data.get('title')
    const requester = player.data.get('requester')
    const source = String(player.data.get('source') ?? '')
    const textQuery = [author, title].filter((x) => !!x).join(' - ')

    const queries: string[] = []
    if (source.toLowerCase() === 'youtube') {
      const identifier = player.data.get('identifier')
      if (identifier)
        queries.push(`https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`)
    }
    if (textQuery) queries.push(`directSearch=scsearch:${textQuery}`)

    for (const query of queries) {
      const result = await player.search(query, { requester: requester }).catch(() => null)
      if (!result || !result.tracks?.length) continue

      const tracks = result.tracks.filter(
        (track) =>
          !player.queue.some((queued) => queued.encoded === track.encoded) &&
          !player.queue.previous.some((prev) => prev.encoded === track.encoded)
      )

      if (!tracks.length) continue

      const pick = tracks[Math.floor(Math.random() * tracks.length)]
      player.play(pick)
      return true
    }

    return false
  }
}
