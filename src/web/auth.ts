import { betterAuth } from 'better-auth'
import { kyselyAdapter } from '@better-auth/kysely-adapter'
import { dash } from '@better-auth/infra'
import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import { Manager } from '../manager.js'

export function createAuth(client: Manager) {
  const config = client.config.utilities.WEB_SERVER
  const oauth = config.oauth
  const authDatabase = client.config.utilities.AUTH_DATABASE

  if (!oauth.enable) throw new Error('OAuth is not enabled in app.yml')
  if (!oauth.discord.clientId || !oauth.discord.clientSecret)
    throw new Error('Discord OAuth credentials are missing in app.yml')

  const baseURL = new URL(oauth.redirectURI).origin
  const pgUrl = authDatabase?.config?.url
  if (!pgUrl) throw new Error('AUTH_DATABASE.config.url is missing in app.yml')

  const pool = new pg.Pool({ connectionString: pgUrl })
  const db = new Kysely({ dialect: new PostgresDialect({ pool }) }).withSchema('auth')

  return betterAuth({
    appName: 'Rynote',
    baseURL,
    secret: oauth.secret,
    trustedOrigins: config.cors.origin,
    database: kyselyAdapter(db, {
      type: 'postgres',
      transaction: true,
    }),
    onAPIError: {
      errorURL: `${config.cors.origin.find((o) => o.startsWith('https://') && !o.includes('localhost')) ?? 'https://rynote.vercel.app'}/error`,
    },
    socialProviders: {
      discord: {
        clientId: oauth.discord.clientId,
        clientSecret: oauth.discord.clientSecret,
        scope: ['identify', 'email', 'guilds'],
        mapProfileToUser: (profile) => ({
          email: profile.email ?? `${profile.id}@users.noreply.discord.com`,
          emailVerified: profile.verified ?? false,
        }),
      },
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: ['x-forwarded-for'],
      },
      database: {
        joins: true,
      },
    },
    plugins: [
      dash({
        apiKey: process.env.BETTER_AUTH_API_KEY,
      }),
    ],
  })
}
