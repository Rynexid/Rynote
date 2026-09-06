import { load } from 'js-yaml'
import { config } from 'dotenv'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { QuickDB } from 'dreamvast.quick.db'
import { JSONDriver } from 'dreamvast.quick.db/JSONDriver'
import { MongoDriver } from 'dreamvast.quick.db/MongoDriver'
import { MySQLDriver } from 'dreamvast.quick.db/MySQLDriver'
import { PostgresDriver } from 'dreamvast.quick.db/PostgresDriver'
import { Premium } from '../src/database/schema/Premium.js'
import { GuildPremium } from '../src/database/schema/GuildPremium.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(join(__dirname, '..'))
const OUT = join(ROOT, 'subscription-migration.csv')

const COLUMNS = [
  'member_user_domain',
  'member_user_name',
  'member_user_id',
  'member_email_address',
  'member_join_date',
  'member_expiring_date',
  'member_interval',
  'member_price',
  'member_status',
]

const flags = new Set(process.argv.slice(2))
const includeGuilds = flags.has('--guilds')

function escapeCSV(value: unknown): string {
  const text = value == null ? '' : String(value)
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function toDate(value: number | string | undefined | null): string {
  if (value == null || value === '') return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toISOString().slice(0, 10)
}

function row(input: {
  user: string
  joined?: number
  expires: number | 'lifetime'
  plan?: string
}): string {
  return [
    'Discord',
    input.user,
    input.user,
    '', // member_email_address — tidak tersimpan di DB bot
    toDate(input.joined),
    input.expires === 'lifetime' ? '' : toDate(input.expires),
    input.plan || '',
    '', // member_price — tidak tersimpan di DB bot
    'active',
  ]
    .map(escapeCSV)
    .join(',')
}

config()

const raw = load(readFileSync(join(ROOT, 'app.yml'), 'utf8')) as {
  utilities?: {
    DATABASE?: {
      driver?: 'json' | 'mongodb' | 'mysql' | 'postgres'
      config?: Record<string, any>
    }
  }
}

const database = raw?.utilities?.DATABASE ?? {
  driver: 'json',
  config: { path: './cylane.database.json' },
}
if (process.env.DATABASE_DRIVER) {
  database.driver = process.env.DATABASE_DRIVER as 'json' | 'mongodb' | 'mysql' | 'postgres'
}
const dbConfig = database.config ?? {}

if (process.env.DATABASE_PATH) {
  if (database.driver === 'json') dbConfig.path = process.env.DATABASE_PATH
  else if (database.driver === 'mongodb') dbConfig.uri = process.env.DATABASE_PATH
}

if (process.env.DOCKER_COMPOSE_DATABASE && database.driver === 'mongodb' && process.env.MONGO_URI) {
  dbConfig.uri = String(process.env.MONGO_URI)
}

let driver: any
switch (database.driver) {
  case 'mongodb':
    driver = new MongoDriver((dbConfig.uri as string) || 'mongodb://127.0.0.1:27017/rynote')
    break
  case 'mysql':
    driver = new MySQLDriver(dbConfig)
    break
  case 'postgres':
    driver = new PostgresDriver(dbConfig)
    break
  case 'json':
  default:
    driver = new JSONDriver((dbConfig.path as string) || './cylane.database.json')
    break
}

const db = new QuickDB({ driver })
await db.init()

const premiumTable = await db.table<Premium>('premium')
const premiumRows = await premiumTable.all()

const rows: string[] = []

let includedUsers = 0
for (const { value: premium } of premiumRows) {
  if (!premium?.isPremium) continue
  const user = premium.redeemedBy
  rows.push(
    row({
      user: user.id,
      joined: premium.redeemedAt,
      expires: premium.expiresAt,
      plan: premium.plan,
    })
  )
  includedUsers++
}

let includedGuilds = 0
if (includeGuilds) {
  const guildTable = await db.table<GuildPremium>('preGuild')
  const guildRows = await guildTable.all()
  for (const { value: guild } of guildRows) {
    if (!guild?.isPremium) continue
    const owner = guild.redeemedBy.ownerId || guild.redeemedBy.id
    rows.push(
      row({
        user: owner,
        joined: guild.redeemedAt,
        expires: guild.expiresAt,
        plan: guild.plan,
      })
    )
    includedGuilds++
  }
}

const csv = [
  COLUMNS.join(','),
  ...rows.sort((a, b) => a.localeCompare(b, 'en', { numeric: true })),
].join('\n')

writeFileSync(OUT, '\uFEFF' + csv + '\n')

console.log('Generated:', OUT)
console.log(`Users:   ${premiumRows.length} premium rows in DB, ${includedUsers} active included`)
console.log(
  `Guilds:  ${includeGuilds ? `${includedGuilds} included (owners)` : 'skipped (use --guilds)'}`
)
console.log(`Output rows: ${rows.length}`)
if (rows.length === 0) {
  console.log(
    'No active premium data found — file contains header only (template). Empty DB locally; run where the bot DB lives for real rows.'
  )
}

await db.close()
process.exit(0)
