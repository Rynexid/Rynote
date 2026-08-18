import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler, ParseMentionEnum } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'
import { ApplicationCommandOptionType, User } from 'discord.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['banner']
  public description = "Show your or someone else's banner"
  public category = 'Image'
  public accessableby = [Accessableby.Member]
  public usage = '<mention>'
  public aliases = ['bnr']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'user',
      description: 'The user to show the banner of',
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()
    const data = handler.args[0]
    const getData = await handler.parseMentions(data)

    if (data && getData && getData.type !== ParseMentionEnum.USER)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          color: client.color,
          description: `${client.i18n.get(handler.language, 'error', 'arg_error', {
            text: '**@mention**!',
          })}`,
        }),
      } as any)

    const target = (getData && getData.type === ParseMentionEnum.USER ? getData.data : handler.user) as User

    const url = target.bannerURL({ size: 512 })
    if (!url)
      return handler.editReply({
        flags: 32768,
        components: buildV2({
          color: client.color,
          description: `${client.i18n.get(handler.language, 'error', 'no_banner', {
            user: target.username,
          })}`,
        }),
      } as any)

    const components = buildV2({
      color: client.color,
      title: client.i18n.get(handler.language, 'command.image', 'banner_title', {
        username: target.username,
      }),
      image: url,
    })
    await handler.editReply({ flags: 32768, components } as any)
  }
}
