import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  ComponentType,
  Message,
  MessageFlags,
} from 'discord.js'
import { RainlinkPlayer } from 'rainlink'
import { Manager } from '../manager.js'

export class PageQueue {
  client: Manager
  pages: any[][]
  timeout: number
  queueLength: number
  language: string
  clearable: boolean
  player?: RainlinkPlayer
  cleared = false

  constructor(
    client: Manager,
    pages: any[][],
    timeout: number,
    queueLength: number,
    language: string,
    options?: { clearable?: boolean; player?: RainlinkPlayer }
  ) {
    this.client = client
    this.pages = pages
    this.timeout = timeout
    this.queueLength = queueLength
    this.language = language
    this.clearable = options?.clearable ?? false
    this.player = options?.player
  }

  private buildNavRow(disabled = false): ActionRowBuilder<ButtonBuilder> {
    const buttons = [
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('◀')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
    ]
    if (this.clearable && this.player) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId('queue_clear')
          .setEmoji(this.client.config.emojis.PLAYER.delete)
          .setStyle(ButtonStyle.Danger)
          .setDisabled(disabled)
      )
    }
    return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)
  }

  private onClear(interaction: ButtonInteraction) {
    if (!this.player) return false
    this.player.queue.clear()
    const guildId = interaction.guildId ?? interaction.guild?.id
    if (guildId) {
      this.client.wsl.get(guildId)?.send({
        op: 'playerClearQueue',
        guild: guildId,
      })
    }
    this.cleared = true
    return true
  }

  private clearedComponents(disabled?: ActionRowBuilder<ButtonBuilder>): any[] {
    return [
      {
        type: 17,
        accent_color: this.client.color,
        components: [
          {
            type: 10,
            content: this.client.i18n.get(this.language, 'command.music', 'clearqueue_msg'),
          },
        ],
      },
      (disabled ?? this.buildNavRow(true)).toJSON(),
    ]
  }

  async slashPage(interaction: CommandInteraction, queueDuration: string) {
    if (!interaction && !(interaction as CommandInteraction).channel)
      throw new Error('Channel is inaccessible.')
    if (!this.pages) throw new Error('Pages are not given.')

    const row1 = new ButtonBuilder()
      .setCustomId('back')
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
    const row2 = new ButtonBuilder()
      .setCustomId('next')
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
    const navRow: ActionRowBuilder<ButtonBuilder> = this.buildNavRow()

    let page = 0

    const getFooterText = (p: number) =>
      this.client.i18n.get(this.language, 'command.music', 'queue_footer', {
        page: String(p + 1),
        pages: String(this.pages.length),
        queue_lang: String(this.queueLength),
        duration: String(queueDuration),
      })

    const buildComponents = (p: number) => [
      ...this.pages[p],
      { type: 10, content: getFooterText(p) },
      navRow.toJSON(),
    ]

    const curPage = await interaction.editReply({
      flags: 32768,
      components: buildComponents(page),
    })
    if (this.pages.length == 0) return

    const collector = curPage.createMessageComponentCollector({
      filter: (m) => m.user.id === interaction.user.id,
      time: this.timeout,
      componentType: ComponentType.Button,
    })

    collector.on('collect', async (interaction) => {
      if (!interaction.deferred) await interaction.deferUpdate()

      if (interaction.customId === 'back') {
        page = page > 0 ? --page : this.pages.length - 1
        curPage
          .edit({
            flags: 32768,
            components: buildComponents(page),
          })
          .catch(() => null)
      } else if (interaction.customId === 'next') {
        page = page + 1 < this.pages.length ? ++page : 0
        curPage
          .edit({
            flags: 32768,
            components: buildComponents(page),
          })
          .catch(() => null)
      } else if (interaction.customId === 'queue_clear' && this.onClear(interaction)) {
        collector.stop()
      }
    })

    collector.on('end', async () => {
      if (this.cleared) {
        await curPage.edit({ flags: 32768, components: this.clearedComponents() }).catch(() => null)
      } else {
        await curPage
          .edit({
            flags: 32768,
            components: [
              ...this.pages[page],
              { type: 10, content: getFooterText(page) },
              this.buildNavRow(true).toJSON(),
            ],
          })
          .catch(() => null)
      }
      // @ts-ignore
      collector.removeAllListeners()
    })

    return curPage
  }

  async slashPlaylistPage(interaction: CommandInteraction) {
    if (!interaction && !(interaction as CommandInteraction).channel)
      throw new Error('Channel is inaccessible.')
    if (!this.pages) throw new Error('Pages are not given.')

    const row1 = new ButtonBuilder()
      .setCustomId('back')
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
    const row2 = new ButtonBuilder()
      .setCustomId('next')
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
    const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(row1, row2)

    let page = 0

    const getFooterText = (p: number) =>
      this.client.i18n.get(this.language, 'command.playlist', 'view_embed_footer', {
        page: String(p + 1),
        pages: String(this.pages.length),
        songs: String(this.queueLength),
      })

    const buildComponents = (p: number) => [
      ...this.pages[p],
      { type: 10, content: getFooterText(p) },
      navRow.toJSON(),
    ]

    const curPage = await interaction.editReply({
      flags: 32768,
      components: buildComponents(page),
    })
    if (this.pages.length == 0) return

    const collector = curPage.createMessageComponentCollector({
      filter: (m) => m.user.id === interaction.user.id,
      time: this.timeout,
      componentType: ComponentType.Button,
    })

    collector.on('collect', async (interaction) => {
      if (!interaction.deferred) await interaction.deferUpdate()
      if (interaction.customId === 'back') {
        page = page > 0 ? --page : this.pages.length - 1
      } else if (interaction.customId === 'next') {
        page = page + 1 < this.pages.length ? ++page : 0
      }
      curPage
        .edit({
          flags: 32768,
          components: buildComponents(page),
        })
        .catch(() => null)
    })
    collector.on('end', () => {
      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('back')
          .setLabel('◀')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      )
      curPage
        .edit({
          flags: 32768,
          components: [
            ...this.pages[page],
            { type: 10, content: getFooterText(page) },
            disabledRow.toJSON(),
          ],
        })
        .catch(() => null)
      // @ts-ignore
      collector.removeAllListeners()
    })
    return curPage
  }

  async prefixPage(message: Message, queueDuration: string) {
    if (!message && !(message as Message).channel) throw new Error('Channel is inaccessible.')
    if (!this.pages) throw new Error('Pages are not given.')

    const row1 = new ButtonBuilder()
      .setCustomId('back')
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
    const row2 = new ButtonBuilder()
      .setCustomId('next')
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
    const navRow: ActionRowBuilder<ButtonBuilder> = this.buildNavRow()

    let page = 0

    const getFooterText = (p: number) =>
      this.client.i18n.get(this.language, 'command.music', 'queue_footer', {
        page: String(p + 1),
        pages: String(this.pages.length),
        queue_lang: String(this.queueLength),
        duration: String(queueDuration),
      })

    const buildComponents = (p: number) => [
      ...this.pages[p],
      { type: 10, content: getFooterText(p) },
      navRow.toJSON(),
    ]

    const curPage = await message.reply({
      flags: 32768,
      components: buildComponents(page),
      allowedMentions: { repliedUser: false },
    })
    if (this.pages.length == 0) return

    const collector = curPage.createMessageComponentCollector({
      filter: (interaction) =>
        interaction.user.id === message.author.id ? true : false && interaction.deferUpdate(),
      time: this.timeout,
      componentType: ComponentType.Button,
    })

    collector.on('collect', async (interaction) => {
      if (!interaction.deferred) await interaction.deferUpdate()
      if (interaction.customId === 'back') {
        page = page > 0 ? --page : this.pages.length - 1
      } else if (interaction.customId === 'next') {
        page = page + 1 < this.pages.length ? ++page : 0
      } else if (interaction.customId === 'queue_clear' && this.onClear(interaction)) {
        collector.stop()
        return
      }
      const route = `/channels/${curPage.channel.id}/messages/${curPage.id}` as `/${string}`
      this.client.rest
        .patch(route, {
          body: {
            flags: 32768,
            components: buildComponents(page),
          },
        })
        .catch(() => null)
    })
    collector.on('end', async () => {
      const route = `/channels/${curPage.channel.id}/messages/${curPage.id}` as `/${string}`
      if (this.cleared) {
        await this.client.rest
          .patch(route, {
            body: {
              flags: 32768,
              components: this.clearedComponents(),
            },
          })
          .catch(() => null)
      } else {
        await this.client.rest
          .patch(route, {
            body: {
              flags: 32768,
              components: [
                ...this.pages[page],
                { type: 10, content: getFooterText(page) },
                this.buildNavRow(true).toJSON(),
              ],
            },
          })
          .catch(() => null)
      }
      // @ts-ignore
      collector.removeAllListeners()
    })
    return curPage
  }

  async prefixPlaylistPage(message: Message) {
    if (!message && !(message as Message).channel) throw new Error('Channel is inaccessible.')
    if (!this.pages) throw new Error('Pages are not given.')

    const row1 = new ButtonBuilder()
      .setCustomId('back')
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
    const row2 = new ButtonBuilder()
      .setCustomId('next')
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
    const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(row1, row2)

    let page = 0

    const getFooterText = (p: number) =>
      this.client.i18n.get(this.language, 'command.playlist', 'view_embed_footer', {
        page: String(p + 1),
        pages: String(this.pages.length),
        songs: String(this.queueLength),
      })

    const buildComponents = (p: number) => [
      ...this.pages[p],
      { type: 10, content: getFooterText(p) },
      navRow.toJSON(),
    ]

    const curPage = await message.reply({
      flags: 32768,
      components: buildComponents(page),
      allowedMentions: { repliedUser: false },
    })
    if (this.pages.length == 0) return

    const collector = curPage.createMessageComponentCollector({
      filter: (interaction) =>
        interaction.user.id === message.author.id ? true : false && interaction.deferUpdate(),
      time: this.timeout,
      componentType: ComponentType.Button,
    })

    collector.on('collect', async (interaction) => {
      if (!interaction.deferred) await interaction.deferUpdate()
      if (interaction.customId === 'back') {
        page = page > 0 ? --page : this.pages.length - 1
      } else if (interaction.customId === 'next') {
        page = page + 1 < this.pages.length ? ++page : 0
      }
      const route = `/channels/${curPage.channel.id}/messages/${curPage.id}` as `/${string}`
      this.client.rest
        .patch(route, {
          body: {
            flags: 32768,
            components: buildComponents(page),
          },
        })
        .catch(() => null)
    })
    collector.on('end', () => {
      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('back')
          .setLabel('◀')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      )
      const route = `/channels/${curPage.channel.id}/messages/${curPage.id}` as `/${string}`
      this.client.rest
        .patch(route, {
          body: {
            flags: 32768,
            components: [
              ...this.pages[page],
              { type: 10, content: getFooterText(page) },
              disabledRow.toJSON(),
            ],
          },
        })
        .catch(() => null)
      // @ts-ignore
      collector.removeAllListeners()
    })
    return curPage
  }

  async buttonPage(interaction: ButtonInteraction, queueDuration: string) {
    if (!interaction && !(interaction as unknown as CommandInteraction).channel)
      throw new Error('Channel is inaccessible.')
    if (!this.pages) throw new Error('Pages are not given.')

    const row1 = new ButtonBuilder()
      .setCustomId('back')
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
    const row2 = new ButtonBuilder()
      .setCustomId('next')
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
    const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(row1, row2)

    let page = 0

    const getFooterText = (p: number) =>
      this.client.i18n.get(this.language, 'command.music', 'queue_footer', {
        page: String(p + 1),
        pages: String(this.pages.length),
        queue_lang: String(this.queueLength),
        duration: String(queueDuration),
      })

    const buildComponents = (p: number) => [
      ...this.pages[p],
      { type: 10, content: getFooterText(p) },
      navRow.toJSON(),
    ]

    const curPage = await interaction.followUp({
      flags: MessageFlags.Ephemeral | 32768,
      components: buildComponents(page),
    })
    if (this.pages.length == 0) return

    const collector = curPage.createMessageComponentCollector({
      filter: (m) => m.user.id === interaction.user.id,
      time: this.timeout,
      componentType: ComponentType.Button,
    })

    collector.on('collect', async (interaction) => {
      if (!interaction.deferred) await interaction.deferUpdate()

      if (interaction.customId === 'back') {
        page = page > 0 ? --page : this.pages.length - 1
      } else if (interaction.customId === 'next') {
        page = page + 1 < this.pages.length ? ++page : 0
      }
      curPage
        .edit({
          flags: 32768,
          components: buildComponents(page),
        })
        .catch(() => null)
    })

    collector.on('end', () => {
      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('back')
          .setLabel('◀')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      )
      curPage
        .edit({
          flags: 32768,
          components: [
            ...this.pages[page],
            { type: 10, content: getFooterText(page) },
            disabledRow.toJSON(),
          ],
        })
        .catch(() => null)
      // @ts-ignore
      collector.removeAllListeners()
    })

    return curPage
  }
}
