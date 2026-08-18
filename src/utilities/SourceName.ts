import { RainlinkTrack } from 'rainlink'
import { Manager } from '../manager.js'

export function getSourceName(client: Manager, track: RainlinkTrack, language: string) {
  if (!track.source) return client.i18n.get(language, 'command.music', 'unknown')
  return track.source.charAt(0).toUpperCase() + track.source.slice(1)
}
