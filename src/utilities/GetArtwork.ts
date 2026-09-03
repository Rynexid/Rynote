import { RainlinkTrack } from 'rainlink'

const YT_THUMB = 'https://img.youtube.com/vi'

export function getArtwork(track: RainlinkTrack): string {
  if (track.artworkUrl) return track.artworkUrl
  if (track.source === 'youtube' && track.identifier) return `${YT_THUMB}/${track.identifier}/maxresdefault.jpg`
  return ''
}