import { load } from 'js-yaml'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { QuickDB } from 'dreamvast.quick.db'
import { JSONDriver } from 'dreamvast.quick.db/JSONDriver'
import { MongoDriver } from 'dreamvast.quick.db/MongoDriver'
import { MySQLDriver } from 'dreamvast.quick.db/MySQLDriver'
import { PostgresDriver } from 'dreamvast.quick.db/PostgresDriver'
import { Prefix } from '../src/database/schema/Prefix.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(join(__dirname, '..'))

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

const prefixTable = await db.table<Prefix>('prefix')
const rows = await prefixTable.all()

const flags = new Set(process.argv.slice(2))
if (!flags.has('--commit')) {
  console.log(`DRY RUN — delete would remove ${rows.length} prefix rows. Re-run with --commit to apply.`)
  for (const { id, value } of rows.slice(0, 20)) {
    console.log(`  ${id} -> ${typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value)}`)
  }
} else {
  const deleted = await prefixTable.deleteAll()
  console.log(`Deleted ${deleted} prefix rows from table 'prefix'. Guilds now use app.yml prefix.`)
}

await db.close()
process.exit(0)