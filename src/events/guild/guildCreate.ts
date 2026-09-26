import { Manager } from '../../manager.js'
import { Guild, MessageFlags, PermissionFlagsBits } from 'discord.js'
import { BlacklistService } from '../../services/BlacklistService.js'
import { GuildLogService } from '../../services/GuildLogService.js'
import { RYNOTE_BANNER_URL } from '../../utilities/Links.js'

export default class {
  async execute(client: Manager, guild: Guild) {
    const blacklistService = new BlacklistService(client)
    if (await blacklistService.checkGuild(guild.id)) {
      await guild.leave()
      client.logger.info(
        'GuildCreate',
        `Blocked guild ${guild.name} from joining due to blacklist restriction`
      )
      return
    }
    client.logger.info('GuildCreate', `Joined guild ${guild.name} @ ${guild.id}`)
    const owner = await guild.fetchOwner()
    const language = client.config.bot.LANGUAGE

    client.guilds.cache.set(`${guild!.id}`, guild)

    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(language, 'command.info', key, args)

    let PREFIX = client.prefix
    const GuildPrefix = await client.db.prefix.get(`${guild!.id}`)
    if (GuildPrefix) PREFIX = GuildPrefix

    const thanks = client.i18n.get(language, 'event.guild', 'join_dm_thanks', {
      username: client.user!.username,
    })
    const welcome = client.i18n.get(language, 'event.guild', 'join_dm_welcome', {
      username: client.user!.username,
    })
    const footer = client.i18n.get(language, 'event.guild', 'join_dm_footer', {
      help: `\`${PREFIX}help\` or \`/help\``,
      helpdetail: `\`${PREFIX}help <command>\` or \`/help <command>\``,
    })

    const info =
      `- ${L('botinfo_prefix')} \`${PREFIX}\` or \`/\`\n` +
      `- ${L('info_codename')} ${client.manifest.metadata.bot.codename}\n` +
      `- ${L('info_version')} ${client.manifest.metadata.bot.version}\n` +
      `- ${L('botinfo_type')} ${L('botinfo_type_val')}\n` +
      `- ${L('botinfo_lib')} Discord.js ${client.manifest.package.discordjs}\n` +
      `- ${L('info_rainlink')} ${client.manifest.package.rainlink}\n` +
      `- ${L('botinfo_autofix')} ${client.manifest.metadata.autofix.version}\n` +
      `- ${L('botinfo_powered')} [Rynex](https://rynexdev.vercel.app?ref=discord)\n` +
      `- ${L('botinfo_partnered')} 1sT - Services`

    const content = `# ${thanks}\n\n${welcome}\n\n${info}\n\n${footer}`

    const container = {
      type: 17,
      accent_color: client.color,
      components: [
        {
          type: 12,
          items: [{ media: { url: RYNOTE_BANNER_URL }, description: client.user!.username }],
        },
        { type: 10, content },
      ],
    }

    const userDm = await owner.createDM(true).catch(() => null)
    if (userDm) {
      userDm
        .send({ flags: MessageFlags.IsComponentsV2, components: [container] } as any)
        .catch(() => {})
    }

    new GuildLogService(client, guild, 'joined').execute(
      {
        displayName: owner.displayName,
        id: guild.ownerId,
      },
      await getInvite(guild)
    )
  }
}

async function getInvite(guild: Guild) {
  const me = guild.members.me
  if (!me) return undefined
  const channel = guild.channels.cache
    .filter(
      (c) =>
        c.isTextBased() &&
        (c.permissionsFor(me)?.has([
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.CreateInstantInvite,
        ]) ??
          false)
    )
    .first() as import('discord.js').TextChannel | undefined
  if (!channel) return undefined
  return channel
    .createInvite({ maxAge: 86400, maxUses: 0, reason: 'Rynote guild log invite' })
    .then((invite) => `https://discord.gg/${invite.code}`)
    .catch(() => undefined)
}