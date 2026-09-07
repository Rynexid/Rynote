export interface SpotifyUser {
  id: string
  displayName: string
  url: string
  image: string | null
  linkedAt: number
  followers: number | null
}

export interface SpotifyPlaylistSummary {
  name: string
  url: string
  artwork: string | null
}
