import { Manager } from '../../manager.js'
import { EmbedBuilder, TextChannel } from 'discord.js'
import util from 'node:util'
import { AutoReconnectBuilderService } from '../../services/AutoReconnectBuilderService.js'
import { ClearMessageService } from '../../services/ClearMessageService.js'
import { RainlinkPlayer, RainlinkPlayerState } from 'rainlink'

const RETRY_DELAY = 1500

export default class {
  async execute(client: Manager, player: RainlinkPlayer, data: Record<string, any>) {
    client.logger.error(
      'PlayerException',
      `Player get exception ${util.inspect(data).slice(1).slice(0, -1)}`
    )

    const failedTrack = player.queue.current
    const retryFor = player.data.get('retryFor')
    const isNewTrack = !failedTrack || failedTrack.encoded !== retryFor
    if (isNewTrack) {
      player.data.set('retryFor', failedTrack ? failedTrack.encoded : null)
      player.data.set('retried', false)
    }

    // Single-track playback: retry once on transient failures instead of destroying the player
    if (failedTrack && player.queue.length === 0 && !player.data.get('retried')) {
      player.data.set('retried', true)
      player.data.set('retrying', true)

      const channel = (await client.channels
        .fetch(player.textId)
        .catch(() => undefined)) as TextChannel
      if (channel) {
        let guildModel = await client.db.language.get(`${channel.guild.id}`)
        if (!guildModel)
          guildModel = await client.db.language.set(`${channel.guild.id}`, client.config.bot.LANGUAGE)

        await channel
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription(
                  client.i18n.get(guildModel, 'event.player', 'error_retry_desc', {
                    title: failedTrack.title,
                  })
                ),
            ],
          })
          .catch(() => {})
      }

      client.logger.warn(
        'PlayerException',
        `Retrying track "${failedTrack.title}" in ${RETRY_DELAY}ms`
      )

      setTimeout(() => {
        const currentPlayer = client.rainlink.players.get(player.guildId)
        if (!currentPlayer || currentPlayer.state === RainlinkPlayerState.DESTROYED) return
        if (currentPlayer.queue.current && currentPlayer.queue.current.encoded !== failedTrack.encoded)
          return
        currentPlayer
          .play(failedTrack)
          .catch(() => {
            player.data.set('retrying', false)
            if (!player.queue.length && !player.sudoDestroy) player.destroy().catch(() => {})
          })
      }, RETRY_DELAY)
      return
    }

    /////////// Update Music Setup //////////
    await client.UpdateMusic(player)
    /////////// Update Music Setup ///////////

    player.data.set('retrying', false)

    const fetch_channel = await client.channels.fetch(player.textId).catch(() => undefined)
    const text_channel = fetch_channel! as TextChannel
    if (text_channel) {
      let guildModel = await client.db.language.get(`${text_channel.guild.id}`)
      if (!guildModel)
        guildModel = await client.db.language.set(
          `${text_channel.guild.id}`,
          client.config.bot.LANGUAGE
        )

      await text_channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(
              client.i18n.get(guildModel, 'event.player', 'error_fail_desc', {
                title:
                  failedTrack?.title ?? client.i18n.get(guildModel, 'command.music', 'unknown'),
              })
            ),
        ],
      })
    }

    const data247 = await new AutoReconnectBuilderService(client, player).get(player.guildId)
    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel
    if (data247 !== null && data247 && data247.twentyfourseven && channel)
      new ClearMessageService(client, channel, player)

    const currentPlayer = client.rainlink.players.get(player.guildId) as RainlinkPlayer
    if (!currentPlayer) return
    if (currentPlayer.queue.length > 0) return await player.skip().catch(() => {})
    if (!currentPlayer.sudoDestroy) await player.destroy().catch(() => {})
  }
}
