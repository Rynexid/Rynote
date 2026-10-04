# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-10-05

### Fixed
- Track-picker select menu failed with `DiscordAPIError[50035] ... COMPONENT_OPTION_VALUE_DUPLICATED` when search results contained duplicate track URIs — option values now use unique indexes instead of the track URI
- `/play` option list cleaned up (no more stale `source` option visible once Discord's command cache refreshes)

### Changed
- Player buttons now use emoji-only labels (from `emoji.json`) with a consistent gray style; only Pause/Play (blue) and Clear (red) are colored
- Player control row: Stop replaced by a **Favourite** button (Row 1 = Favourite | Prev | Pause/Play | Skip | Loop)
- `/autoplay` and `/247` now take an explicit `mode` (Boolean for slash; `on/off`, `true/false`, `1/0`, `yes/no` for prefix) with proper invalid/already-using-the-mode messages

### Added
- `Favourite` button handler (`src/buttons/Favourite.ts`) — saves/unsaves the current track into a personal **Favourites** playlist (auto-created)
- `/favorite` slash command (alias `/fav`) in the Profile group to browse your Favourites playlist with pagination
- Queue-empty handler that destroys/resets the player when the queue runs out (respecting 24/7 mode)
- i18n keys for the new favourite feature, `247_invalid`, and autoplay mode messages in both en/id locales

## [1.0.1] - 2026-09-28

### Fixed
- Source-picker now renders real newlines in `play_source_yt` / `play_source_sp` (single-quoted YAML was showing a literal `\n`)
- V2 message components: message sections without an artwork thumbnail fall back to a text display instead of sending an invalid thumbnail accessory (`DiscordAPIError[50035] ... accessory[BASE_TYPE_REQUIRED]`)

### Changed
- `config` command moved from the Profile category to Utils
- Command loader cleanup: removed legacy player/track/websocket events and deprecated Filter/Music commands from the tree

### Added
- `src/utilities/EmojiMap.ts` registered in the build
- Playlist slash commands (`add`, `all`, `create`, `delete`, `detail`, `editor`, `import`, `info`, `remove`, `savequeue`)
- Generated `commands.json` (manifest) and `commands-import.json` (Discord app-command import format)