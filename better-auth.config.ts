import { betterAuth } from 'better-auth'
import { kyselyAdapter } from '@better-auth/kysely-adapter'
import { dash } from '@better-auth/infra'
import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'

const pgUrl =
  process.env.AUTH_DATABASE_URL ??
  'postgresql://Rynex:npg_1KHjxXO8uzZM@ep-icy-smoke-azgjv9kv-pooler.c-3.ap-southeast-1.aws.neon.tech/Rynote?sslmode=require&channel_binding=require'

const pool = new pg.Pool({ connectionString: pgUrl })
const db = new Kysely({ dialect: new PostgresDialect({ pool }) }).withSchema('auth')

export const auth = betterAuth({
  appName: 'Rynote',
  baseURL: 'https://rynote.apps.bot-hosting.cloud',
  secret: process.env.BETTER_AUTH_SECRET ?? 'u+d3DYEAq5hOYrfVLYV8eNJezYtIQvPyAZLNp4iwpME=',
  trustedOrigins: ['https://rynote.vercel.app', 'http://localhost:5173'],
  database: kyselyAdapter(db, {
    type: 'postgres',
    transaction: true,
  }),
  socialProviders: {
    discord: {
      clientId: '1496804643530080376',
      clientSecret: 'j7AQEvPi64CTnD7A4D4XbEC06DvpfxfM',
    },
  },
  plugins: [
    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY,
    }),
  ],
})