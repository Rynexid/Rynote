import { ClusterManagerOptions } from '../cluster/core.js'
import { RainlinkNodeOptions } from 'rainlink'

export interface Config {
  bot: Bot
  player: Player
  utilities: Utilities
  emojis: Emojis
}

export interface Bot {
  TOKEN: string
  EMBED_COLOR: string
  OWNER_ID: string
  ADMIN: string[]
  LANGUAGE: string
  DEBUG_MODE: boolean
  SUPPORT: string
}

export interface Utilities {
  SHARDING_SYSTEM: ClusterManagerOptions
  AUTO_RESUME: boolean
  DELETE_MSG_TIMEOUT: number
  DATABASE: Database
  TOPGG_TOKEN: string
  MESSAGE_CONTENT: MessageContent
  AUTOFIX_LAVALINK: AutofixLavalink
  WEB_SERVER: WebServer
  PREMIUM_LOG_CHANNEL: string
  GUILD_LOG_CHANNEL: string
  LOG_CHANNEL: string
}

export interface AutofixLavalink {
  enable: boolean
  retryCount: number
  retryTimeout: number
}

export interface Database {
  driver: string
  config: any
  cacheCleanSchedule: string
}

export interface MessageContent {
  enable: boolean
  commands: Commands
}

export interface Commands {
  enable: boolean
  prefix: string
}

export interface WebServer {
  host: string
  enable: boolean
  port: number
  auth: string
  whitelist: string[]
  cors: {
    origin: string[]
    methods: string[]
  }
}

export interface Player {
  SPOTIFY: Spotify
  AUTOCOMPLETE_SEARCH: string[]
  NP_REALTIME: boolean
  LEAVE_TIMEOUT: number
  NODES: RainlinkNodeOptions[]
  DEFAULT_VOLUME: number
  AVOID_SUSPEND: boolean
  LIMIT_TRACK: number
  LIMIT_PLAYLIST: number
  GENIUS_TOKEN: string
}

export interface Spotify {
  enable: boolean
  id: string
  secret: string
}

export interface Emojis {
  PLAYER: PlayerEmojis
  GLOBAL: GlobalEmojis
  CATEGORY: CategoryEmojis
  USER: UserEmojis
}

export interface PlayerEmojis {
  play: string
  pause: string
  loop: string
  shuffle: string
  stop: string
  skip: string
  previous: string
  voldown: string
  volup: string
  queue: string
  delete: string
}

export interface GlobalEmojis {
  arrow_next: string
  arrow_previous: string
}

export interface CategoryEmojis {
  Music: string
  Playlist: string
  Info: string
  Filter: string
  Image: string
  Premium: string
  Utils: string
  Owner: string
}

export interface UserEmojis {
  Owner: string
  Premium: string
  Dev: string
}
