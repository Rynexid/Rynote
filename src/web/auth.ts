import { betterAuth } from 'better-auth'
import { mongooseAdapter } from 'better-auth-mongoose'
import { dash } from '@better-auth/infra'
import mongoose from 'mongoose'
import { Manager } from '../manager.js'

export function createAuth(client: Manager) {
  const config = client.config.utilities.WEB_SERVER
  const oauth = config.oauth

  if (!oauth.enable) throw new Error('OAuth is not enabled in app.yml')
  if (!oauth.discord.clientId || !oauth.discord.clientSecret)
    throw new Error('Discord OAuth credentials are missing in app.yml')

  const baseURL = new URL(oauth.redirectURI).origin

  // Use existing mongoose connection (mongoose.connect should have been called elsewhere)
  // or create one if needed
  const db = mongoose.connection

  return betterAuth({
    appName: 'Rynote',
    baseURL,
    secret: oauth.secret,
    trustedOrigins: config.cors.origin,
    database: mongooseAdapter(db),
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