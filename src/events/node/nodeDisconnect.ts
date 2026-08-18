import { Manager } from '../../manager.js'
import { RainlinkNode } from 'rainlink'

export default class {
  execute(client: Manager, node: RainlinkNode, code: number, reason: Buffer) {
    client.rainlink.players.forEach((player, index) => {
      if (player.node.options.name == node.options.name) player.destroy().catch(() => {})
    })

    const lavalinkIndex = client.lavalinkUsing.findIndex(
      (data) => data.name == node.options.name
    )
    if (lavalinkIndex !== -1) client.lavalinkUsing.splice(lavalinkIndex, 1)

    client.logger.debug(
      'NodeDisconnect',
      `Lavalink ${node.options.name}: Disconnected, Code: ${code}, Reason: ${reason}`
    )
  }
}
