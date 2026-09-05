import {
  Attachment,
  BaseMessageOptions,
  Channel,
  Collection,
  CommandInteraction,
  Guild,
  GuildMember,
  InteractionResponse,
  Message,
  Role,
  TextBasedChannel,
  User,
} from 'discord.js'
import { Manager } from '../manager.js'

export type CommandHandlerOptions = {
  interaction?: CommandInteraction
  message?: Message
  language: string
  client: Manager
  args: string[]
  prefix: string
}

export type GlobalMsg = InteractionResponse<boolean> | (Message<boolean> | undefined)

export enum ParseMentionEnum {
  ERROR,
  USER,
  ROLE,
  EVERYONE,
  CHANNEL,
}

export interface ParseMentionInterface {
  type: ParseMentionEnum
  data: User | Channel | Role | true | 'error' | undefined
}

export class CommandHandler {
  public interaction?: CommandInteraction
  public attactments: Attachment[] = []
  public message?: Message
  public language: string
  public user?: User | null
  public guild?: Guild | null
  public member?: GuildMember | null
  public channel?: TextBasedChannel | null
  public client: Manager
  public args: string[]
  public createdAt: number
  public msg: GlobalMsg
  public prefix: string
  public modeLang: { enable: string; disable: string }
  public USERS_PATTERN: RegExp = /<@!?(\d{17,19})>/
  public ROLES_PATTERN: RegExp = /<@&(\d{17,19})>/
  public CHANNELS_PATTERN: RegExp = /<#(\d{17,19})>/
  public EVERYONE_PATTERN: RegExp = /@(everyone|here)/

  constructor(options: CommandHandlerOptions) {
    this.client = options.client
    this.interaction = options.interaction
    this.message = options.message
    this.language = options.language
    this.guild = this.guildData
    this.user = this.userData
    this.member = this.memberData
    this.args = options.args
    this.createdAt = this.createdStimeStampData
    this.prefix = options.prefix
    this.channel = this.channelData
    this.modeLang = this.modeLangData
  }

  get userData() {
    if (this.interaction) {
      return this.interaction.user
    } else {
      return this.message?.author
    }
  }

  get modeLangData() {
    return {
      enable: `${this.client.i18n.get(this.language, 'global', 'enable')}`,
      disable: `${this.client.i18n.get(this.language, 'global', 'disable')}`,
    }
  }

  get guildData() {
    if (this.interaction) {
      return this.interaction.guild
    } else {
      return this.message?.guild
    }
  }

  get memberData() {
    if (this.interaction) {
      return this.interaction.member as GuildMember
    } else {
      return this.message?.member
    }
  }

  get createdStimeStampData() {
    if (this.interaction) {
      return Number(this.interaction.createdTimestamp)
    } else {
      return Number(this.message?.createdTimestamp)
    }
  }

  get channelData() {
    if (this.interaction) {
      return this.interaction.channel
    } else {
      return this.message?.channel
    }
  }

  public async sendMessage(data: string | BaseMessageOptions) {
    if (this.interaction) {
      return await this.interaction.reply(data)
    } else {
      try {
        return await this.message?.reply(data)
      } catch {
        try {
          return await (this.message?.channel as any).send(data)
        } catch {
          throw new Error('Failed to send message')
        }
      }
    }
  }

  public async followUp(data: string | BaseMessageOptions) {
    if (this.interaction) {
      return await this.interaction.followUp(data)
    } else {
      try {
        return await this.message?.reply(data)
      } catch {
        try {
          return await (this.message?.channel as any).send(data)
        } catch {
          throw new Error('Failed to send follow-up message')
        }
      }
    }
  }

  public async deferReply() {
    if (this.msg) return
    if (this.interaction) {
      const data = await this.interaction.deferReply()
      return (this.msg = data)
    } else {
      try {
        const data = await this.message?.reply(
          `${this.client.i18n.get(this.language, 'global', 'is_thinking', {
            username: this.client.user?.username,
          })}`
        )
        return (this.msg = data)
      } catch {
        try {
          const data = await (this.message?.channel as any).send(
            `${this.client.i18n.get(this.language, 'global', 'is_thinking', {
              username: this.client.user?.username,
            })}`
          )
          return (this.msg = data)
        } catch {
          throw new Error('Failed to defer reply')
        }
      }
    }
  }

  public async editReply(data: BaseMessageOptions): Promise<GlobalMsg> {
    if (!this.msg) {
      this.client.logger.error(CommandHandler.name, 'You have not declared deferReply()')
      return
    }
    const d = data as any
    const isV2 =
      d.flags != null && (Array.isArray(d.flags) ? d.flags.includes(32768) : d.flags & 32768)
    if (this.interaction) {
      if (isV2) {
        return this.interaction.editReply({
          flags: 32768,
          components: (data as any).components,
          ...((data as any).files ? { files: (data as any).files } : {}),
        } as any)
      }
      return this.msg.edit(data)
    } else {
      if (isV2) {
        await this.msg.delete().catch(() => null)
        return this.sendMessage({ flags: 32768, components: (data as any).components } as any)
      }
      if (data.embeds && !data.content)
        return this.msg.edit({
          content: '',
          embeds: data.embeds,
          components: data.components,
          allowedMentions: data.allowedMentions,
        })
      else return this.msg.edit(data)
    }
  }

  public async replyV2(components: any[], extra: BaseMessageOptions = {}) {
    if (this.interaction) {
      await this.deferReply()
      return this.interaction.editReply({ flags: 32768, components, ...extra } as any)
    }
    return this.sendMessage({ flags: 32768, components, ...extra } as any)
  }

  public async parseMentions(data: string): Promise<ParseMentionInterface> {
    if (this.USERS_PATTERN.test(data)) {
      const extract = this.USERS_PATTERN.exec(data)
      const user = await this.client.users.fetch(extract![1]).catch(() => undefined)
      if (!user || user == null)
        return {
          type: ParseMentionEnum.ERROR,
          data: 'error',
        }
      return {
        type: ParseMentionEnum.USER,
        data: user,
      }
    }
    if (this.CHANNELS_PATTERN.test(data)) {
      const extract = this.CHANNELS_PATTERN.exec(data)
      const channel = await this.client.channels.fetch(extract![1]).catch(() => undefined)
      if (!channel || channel == null)
        return {
          type: ParseMentionEnum.ERROR,
          data: 'error',
        }
      return {
        type: ParseMentionEnum.CHANNEL,
        data: channel,
      }
    }
    if (this.ROLES_PATTERN.test(data)) {
      const extract = this.ROLES_PATTERN.exec(data)
      const role = this.message
        ? await this.message.guild?.roles.fetch(extract![1]).catch(() => undefined)
        : await this.interaction?.guild?.roles.fetch(extract![1]).catch(() => undefined)
      if (!role || role == null)
        return {
          type: ParseMentionEnum.ERROR,
          data: 'error',
        }
      return {
        type: ParseMentionEnum.ROLE,
        data: role,
      }
    }
    if (this.EVERYONE_PATTERN.test(data)) {
      return {
        type: ParseMentionEnum.EVERYONE,
        data: true,
      }
    }
    return {
      type: ParseMentionEnum.ERROR,
      data: 'error',
    }
  }

  public addAttachment(data: Collection<string, Attachment>) {
    return this.attactments.push(
      ...data.map((data) => {
        return data
      })
    )
  }
}
