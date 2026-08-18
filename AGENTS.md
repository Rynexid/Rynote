# AGENTS.md

## Project
Rynote: Discord music bot (discord.js v14, rainlink/Lavalink v4, Fastify API). Two runtimes: root bot (Node 24 + TS, ESM) and `dashboard/` (React 19 + Vite + Tailwind v4).

## Package Managers
- Root bot: **npm**. No lockfile is committed; run `npm install` — the resulting `package-lock.json` is required by `scripts/deploy.sh` (it scp's it to the VPS).
- Dashboard: **bun** (`dashboard/bun.lock`). `npm run ...` scripts work too, but `npm install` there adds a conflicting `package-lock.json`.
- The `pnpm.overrides` block in package.json is a leftover — don't switch to pnpm.

## Commands
```bash
# Root bot
npm run build          # tsc --build --verbose → dist/
npm run build:full     # prettier -w ./src && build
npm run dev            # nodemon + tsx on src/index.ts (no build needed)
npm run start          # runs ./dist/index.js — build first
npm run start:shard    # sharded entrypoint (src/cluster/index.ts)

# Dashboard (run from ./dashboard)
npm run dev            # vite dev server on http://localhost:5173
npm run build          # tsc -b && vite build
npm run lint           # oxlint — the only lint target in the repo (root has none)
npm run preview        # vite preview
```

## Config & Secrets
- `app.yml` is the primary config with **hardcoded secrets** (bot TOKEN, MongoDB URI, Spotify/GENIUS tokens, web auth). Gitignored — never commit or template it.
- `.env` is loaded via `dotenv` in `src/manager.ts`, `src/cluster/core.ts`, `src/services/ConfigDataService.ts`.
- JSON DB driver state files (`*.database.json`, `cylane.database.json`, `.cylane/`) are gitignored.
- Config gotcha: unknown keys are silently dropped by `mergeDefault` in `src/services/ConfigDataService.ts`. The top-level `web_server:` block in `app.yml` is **ignored** — keys must match `src/@types/Config.ts` (use `utilities.WEB_SERVER`; defaults: port 8080, auth `rynote-dashboard-secret`).

## Architecture
- Local dev Lavalink v4.0.8 lives in `Lavalink/` (100MB jar + plugins + `application.yml`): run with `PYTHONWARNINGS=ignore java -jar Lavalink.jar` (JDK 21+). `PYTHONWARNINGS=ignore` is required — system yt-dlp (used for YouTube search/playback, since the youtube-source plugin is removed) prints a `RequestsDependencyWarning` to stderr that lavasrc's ytdlp source merges into its JSON output, breaking parsing. Password `rynote.gg` must match `player.NODES[].auth` in app.yml; the `/lyrics` command depends on the lavalyrics plugin. `Lavalink/application.yml` has `sources.youtube: false` and `plugins.lavasrc.sources.youtube: false` (YouTube handled via lavasrc `ytdlp: true`); do NOT re-enable them without the `dev.lavalink.youtube:youtube-plugin` jar (backup at `/tmp/opencode/plugins-backup/`).
- Entrypoints: `src/index.ts` (single) / `src/cluster/index.ts` (sharded; `ClusterManager` in `src/cluster/core.ts`, driven by `utilities.SHARDING_SYSTEM`, default 2×2).
- `src/manager.ts` is the `Client` subclass that wires up Rainlink, DB, web server, handlers, and login-with-retry.
- Web server (`src/web/server.ts`, Fastify, port 8080): every `/v1/*` route and the WebSocket require an `Authorization: <utilities.WEB_SERVER.auth>` header.
- DB drivers: `src/database/driver/{json,mongodb,mysql,postgres}.ts`, chosen by `utilities.DATABASE.driver`.
- Commands: `src/commands/{prefix,slash}/`. Events: `src/events/{client,guild,node,player,shard,track,websocket}/`.
- i18n: `languages/{en,id}` YAML files (@hammerhq/localization). Add every new string to **both** locales. Default locale = `bot.LANGUAGE`.

## Build Artifacts
- `dist/` is gitignored; `package.json` `exports` → `./dist/index.js`; `declaration: false` (no `.d.ts` output).
- Nodemon ignores `*.database.json` and maps `.ts` → `tsx`.
- `tsc --build` writes `tsconfig.tsbuildinfo` (gitignored).

## Testing
- No test framework is configured; don't add `*.test.*` files at root.

## Deployment
- `scripts/deploy.sh` (run from the laptop) pushes to hardcoded `root@94.237.77.52` → `/opt/rynote`, uploading `dist/`, `languages/`, `app.yml`, `emoji.json`, `package.json`, `package-lock.json`, `ecosystem.config.cjs`, then `npm install --production`.
- VPS runs systemd units `rynote.service` and `lavalink.service` (Lavalink v4.0.8, port 2333, password `youshallnotpass`). Manage: `systemctl {start|stop|restart|status} rynote`; logs: `journalctl -u rynote -f`.
- deploy.sh uploads the repo `app.yml` as-is, so `player.NODES[].auth` must match the VPS Lavalink password.
- Docker/PM2 (`Dockerfile`, `docker-compose.yml`, `ecosystem.config.cjs`, hardcoded PM2 keys) are legacy — not used in production.
- `docker-compose.yml` runs Lavalink + MongoDB + bot locally; `DOCKER_COMPOSE_MODE` makes ConfigDataService override the Lavalink node and DB URI from env vars.

## Style
- Root: Prettier — no semicolons, single quotes, printWidth 100, tabWidth 2, trailingComma es5 (`npx prettier -w ./src`).
- Dashboard: oxlint with react + typescript plugins.
