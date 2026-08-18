import { Manager } from '../manager.js'
import { RainlinkTrack } from 'rainlink'

export function getTitle(client: Manager, track: RainlinkTrack, language: string) {
  const unknown = client.i18n.get(language, 'command.music', 'unknown')
  if (client.config.player.AVOID_SUSPEND) return track && track.title ? track.title : unknown
  return track && track.title ? `[${track.title}](${track.uri})` : `[${unknown}](https://what.com)`
}
