import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { dash } from '@better-auth/infra'
import { MongoClient } from 'mongodb'
import { Manager } from '../manager.js'

export function createAuth(client: Manager) {
  const config = client.config.utilities.WEB_SERVER
  const oauth = config.oauth
  const database = client.config.utilities.DATABASE

  if (!oauth.enable) throw new Error('OAuth is not enabled in app.yml')
  if (!oauth.discord.clientId || !oauth.discord.clientSecret)
    throw new Error('Discord OAuth credentials are missing in app.yml')

  const baseURL = new URL(oauth.redirectURI).origin
  const mongoUri = database.config?.uri
  if (!mongoUri) throw new Error('DATABASE.config.uri is missing in app.yml')

  const mongoClient = new MongoClient(mongoUri)
  const db = mongoClient.db()

  return betterAuth({
    baseURL,
    secret: oauth.secret,
    trustedOrigins: config.cors.origin,
    database: mongodbAdapter(db, {
      client: mongoClient,
      usePlural: true,
      transaction: false,
    }),
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
    plugins: [
      dash({
        apiKey: process.env.BETTER_AUTH_API_KEY,
      }),
    ],
  })
}