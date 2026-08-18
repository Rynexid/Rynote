import { EmbedBuilder, TextChannel } from 'discord.js'
import { Manager } from '../../manager.js'
import { AutoReconnectBuilderService } from '../../services/AutoReconnectBuilderService.js'
import { ClearMessageService } from '../../services/ClearMessageService.js'
import { RainlinkPlayer, RainlinkPlayerState } from 'rainlink'

export default class {
  async execute(client: Manager, player: RainlinkPlayer) {
    if (!client.isDatabaseConnected)
      return client.logger.warn(
        'DatabaseService',
        'The database is not yet connected so this event will temporarily not execute. Please try again later!'
      )

    /////////// Update Music Setup //////////
    await client.UpdateMusic(player)
    /////////// Update Music Setup ///////////

    if (player.data.get('retrying')) return

    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined)

    if (player.data.get('autoplay') === true) {
      const author = player.data.get('author')
      const title = player.data.get('title')
      const requester = player.data.get('requester')
      const source = String(player.data.get('source') ?? '')
      const textQuery = [author, title].filter((x) => !!x).join(' - ')

      // Try YouTube radio (related songs) first, then fall back to SoundCloud if YouTube fails
      const queries: string[] = []
      if (source.toLowerCase() === 'youtube') {
        const identifier = player.data.get('identifier')
        if (identifier) queries.push(`https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`)
      }
      if (textQuery) queries.push(`directSearch=scsearch:${textQuery}`)

      let finalRes: any[] = []
      for (const q of queries) {
        const res = await player.search(q, { requester: requester }).catch(() => null)
        if (!res || res.tracks.length === 0) continue
        finalRes = res.tracks.filter(
          (t) =>
            !player.queue.some((s) => s.encoded === t.encoded) &&
            !player.queue.previous.some((s) => s.encoded === t.encoded)
        )
        if (finalRes.length !== 0) break
      }

      if (finalRes.length !== 0) {
        player.play(finalRes.length <= 1 ? finalRes[0] : finalRes[1])
        const channel = (await client.channels
          .fetch(player.textId)
          .catch(() => undefined)) as TextChannel
        if (channel) return new ClearMessageService(client, channel, player)
        return
      }

      // Couldn't load any related track from any source -> disable autoplay gracefully
      player.data.set('autoplay', false)
      const fallbackChannel = (await client.channels
        .fetch(player.textId)
        .catch(() => undefined)) as TextChannel
      if (fallbackChannel) {
        let language = await client.db.language.get(`${guild!.id}`)
        if (!language) {
          language = await client.db.language.set(`${guild!.id}`, client.config.bot.LANGUAGE)
        }
        await fallbackChannel
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription(
                  client.i18n.get(language, 'event.player', 'autoplay_disabled')
                ),
            ],
          })
          .catch(() => {})
      }
    }

    client.logger.info('QueueEmpty', `Queue Empty in @ ${guild!.name} / ${player.guildId}`)

    const data = await new AutoReconnectBuilderService(client, player).get(player.guildId)
    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel
    if (data !== null && data && data.twentyfourseven && channel)
      return new ClearMessageService(client, channel, player)

    if (player.state !== RainlinkPlayerState.DESTROYED) await player.destroy().catch(() => {})
  }
}
