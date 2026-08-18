import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler, ParseMentionEnum } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'
import { ApplicationCommandOptionType, User } from 'discord.js'
import { buildV2 } from '../../../utilities/V2.js'

export default class implements Command {
  public name = ['avatar']
  public description = "Show your or someone else's profile picture"
  public category = 'Image'
  public accessableby = [Accessableby.Member]
  public usage = '<mention>'
  public aliases = []
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'user',
      description: 'Type your user here',
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

    const value = getData.data as User

    if (value && (value as any) !== 'error') {
      const components = buildV2({
        color: client.color,
        title: value.username,
        image: `https://cdn.discordapp.com/avatars/${value.id}/${value.avatar}.jpeg?size=300`,
      })
      await handler.editReply({ flags: 32768, components } as any)
    } else {
      const components = buildV2({
        color: client.color,
        title: handler.user!.username,
        image: `https://cdn.discordapp.com/avatars/${handler.user?.id}/${handler.user?.avatar}.jpeg?size=300`,
      })
      await handler.editReply({ flags: 32768, components } as any)
    }
  }
}
