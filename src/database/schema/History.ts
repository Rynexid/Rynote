export interface HistoryEntry {
  title: string
  author: string | null
  artwork: string | null
  uri: string | null
  playedAt: number
}

export type History = HistoryEntry[]
