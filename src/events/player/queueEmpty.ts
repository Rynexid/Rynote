import { Manager } from '../../manager.js'
import { RainlinkPlayer, RainlinkQueue } from 'rainlink'

export default class {
  async execute(client: Manager, player: RainlinkPlayer, queue: RainlinkQueue) {
    if (!player) return

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
    void queue

    const is247 = await client.db.autoreconnect.get(`${player.guildId}`)
    if (is247 && is247.twentyfourseven) return

    await player.destroy().catch(() => null)
  }
}
