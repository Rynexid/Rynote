import { RainlinkTrack } from 'rainlink'

const YT_THUMB = 'https://img.youtube.com/vi'

const YT_SIZES = ['maxresdefault', 'sddefault', 'hqdefault'] as const

async function pickFirstAvailable(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(4000) })
      if (res.ok) return url
    } catch {
      // continue to next candidate
    }
  }
  return null
}

export async function getArtwork(track: RainlinkTrack): Promise<string> {
  if (track.artworkUrl) return track.artworkUrl

  if (track.source === 'youtube' && track.identifier) {
    const candidates = YT_SIZES.map((size) => `${YT_THUMB}/${track.identifier}/${size}.jpg`)
    const available = await pickFirstAvailable(candidates)
    if (available) return available
  }

  return ''
}
