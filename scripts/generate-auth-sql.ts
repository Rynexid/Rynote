import { getMigrations } from 'better-auth/dist/db/get-migration.mjs'
import { auth } from './better-auth.config.ts'

const { compileMigrations } = await getMigrations(auth.options)
const sql = await compileMigrations()
console.log(sql)