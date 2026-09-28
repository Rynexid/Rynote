# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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