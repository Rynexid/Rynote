import { Manager } from '../../manager.js'
import { TextChannel, EmbedBuilder } from 'discord.js'
import { AutoReconnectBuilderService } from '../../services/AutoReconnectBuilderService.js'
import { ClearMessageService } from '../../services/ClearMessageService.js'
import { RainlinkPlayer, RainlinkPlayerState } from 'rainlink'

const RETRY_DELAY = 1500

export default class {
  async execute(client: Manager, player: RainlinkPlayer, data: Record<string, any>) {
    if (!client.isDatabaseConnected)
      return client.logger.warn(
        'DatabaseService',
        'The database is not yet connected so this event will temporarily not execute. Please try again later!'
      )

    /////////// Update Music Setup //////////
    await client.UpdateMusic(player)
    /////////// Update Music Setup ///////////

    if (player.data.get('retrying')) return

    const failedTrack = player.queue.current

    // Single-track playback: retry once on a stuck stream instead of destroying the player (leaving voice)
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

      client.logger.warn('TrackStuck', `Retrying stuck track "${failedTrack.title}" in ${RETRY_DELAY}ms`)

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

    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined)

    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel
    if (!channel) return player.destroy().catch(() => {})

    let guildModel = await client.db.language.get(`${channel.guild.id}`)
    if (!guildModel) {
      guildModel = await client.db.language.set(`${channel.guild.id}`, client.config.bot.LANGUAGE)
    }

    const language = guildModel

    const embed = new EmbedBuilder()
      .setColor(client.color)
      .setDescription(`${client.i18n.get(language, 'event.player', 'error_desc')}`)

    if (channel) {
      const setup = await client.db.setup.get(player.guildId)
      const msg = await channel.send({ embeds: [embed] })
      setTimeout(
        async () =>
          !setup || setup == null || setup.channel !== channel.id
            ? msg.delete().catch(() => null)
            : true,
        client.config.utilities.DELETE_MSG_TIMEOUT
      )
    }

    client.logger.error('TrackStuck', `Track Stuck in ${guild!.name} / ${player.guildId}.`)

    const data247 = await new AutoReconnectBuilderService(client, player).get(player.guildId)
    if (data247 !== null && data247 && data247.twentyfourseven && channel)
      new ClearMessageService(client, channel, player)
    const currentPlayer = client.rainlink.players.get(player.guildId) as RainlinkPlayer
    if (!currentPlayer) return
    if (currentPlayer.queue.length > 0) return await player.skip().catch(() => {})
    if (!currentPlayer.sudoDestroy) await player.destroy().catch(() => {})
  }
}