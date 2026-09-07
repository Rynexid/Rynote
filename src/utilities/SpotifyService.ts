import { Manager } from '../manager.js'
import { SpotifyPlaylistSummary, SpotifyUser } from '../database/schema/SpotifyUser.js'

const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API_URL = 'https://api.spotify.com/v1'

const PROFILE_URL_RE = /open\.spotify\.com\/user\/([^?/\s]+)/

interface TokenCache {
  accessToken: string
  expiresAt: number
}

let cachedToken: TokenCache | null = null

export class SpotifyNotFoundError extends Error {
  constructor(spotifyId: string) {
    super(`Spotify profile not found: ${spotifyId}`)
    this.name = 'SpotifyNotFoundError'
  }
}

const BAD_ARTWORK_VALUES = new Set(['unknown', 'uri', 'null', 'undefined', ''])

function resolveArtwork(url: string | null | undefined): string | null {
  if (!url || BAD_ARTWORK_VALUES.has(url.toLowerCase().trim())) return null
  return url
}

export function extractSpotifyId(input: string): string | null {
  if (!input) return null
  const trimmed = input.trim()

  const match = trimmed.match(PROFILE_URL_RE)
  if (match?.[1]) return match[1]

  if (/^[a-zA-Z0-9._-]+$/.test(trimmed)) return trimmed

  return null
}

export class SpotifyService {
  private client: Manager

  constructor(client: Manager) {
    this.client = client
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now()
    if (cachedToken && cachedToken.expiresAt > now) return cachedToken.accessToken

    const { id, secret } = this.client.config.player.SPOTIFY
    if (!id || !secret) throw new Error('Spotify credentials are not configured')

    const body = new URLSearchParams({ grant_type: 'client_credentials' })
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) throw new Error(`Spotify token error: ${res.status}`)

    const data = (await res.json()) as { access_token: string; expires_in: number }
    cachedToken = {
      accessToken: data.access_token,
      expiresAt: now + (data.expires_in - 60) * 1000,
    }
    return cachedToken.accessToken
  }

  private async api<T>(path: string): Promise<T> {
    const token = await this.getAccessToken()
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    })

    if (res.status === 404) throw new SpotifyNotFoundError(path)
    if (!res.ok) throw new Error(`Spotify API error: ${res.status}`)
    return (await res.json()) as T
  }

  async fetchUser(
    spotifyId: string
  ): Promise<SpotifyUser & { playlists: SpotifyPlaylistSummary[] }> {
    const [user, playlists] = await Promise.all([
      this.api<{
        id: string
        display_name: string | null
        external_urls: { spotify: string }
        images?: { url: string }[]
        followers?: { total: number }
      }>(`/users/${encodeURIComponent(spotifyId)}`),
      this.api<{
        items: {
          id: string
          name: string
          external_urls: { spotify: string }
          images?: { url: string }[]
        }[]
        total?: number
      }>(`/users/${encodeURIComponent(spotifyId)}/playlists?limit=50`),
    ])

    const image = resolveArtwork(user.images?.[0]?.url)

    return {
      id: user.id,
      displayName: user.display_name ?? user.id,
      url: user.external_urls.spotify,
      image,
      linkedAt: Date.now(),
      followers: user.followers?.total ?? null,
      playlists: (playlists.items ?? []).map((pl) => ({
        name: pl.name,
        url: pl.external_urls.spotify,
        artwork: resolveArtwork(pl.images?.[1]?.url ?? pl.images?.[0]?.url),
      })),
    }
  }
}
