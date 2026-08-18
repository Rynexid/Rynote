import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  ComponentType,
  Message,
} from 'discord.js'
import { Manager } from '../manager.js'

export class Page {
  client: Manager
  pages: any[][]
  timeout: number
  language: string

  constructor(client: Manager, pages: any[][], timeout: number, language: string) {
    this.client = client
    this.pages = pages
    this.timeout = timeout
    this.language = language
  }

  async slashPage(interaction: CommandInteraction) {
    if (!interaction && !(interaction as CommandInteraction).channel)
      throw new Error('Channel is inaccessible.')
    if (!this.pages) throw new Error('Pages are not given.')
    if (this.pages.length == 0) return

    const row1 = new ButtonBuilder()
      .setCustomId('back')
      .setLabel('←')
      .setStyle(ButtonStyle.Secondary)
    const row2 = new ButtonBuilder()
      .setCustomId('next')
      .setLabel('→')
      .setStyle(ButtonStyle.Secondary)
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(row1, row2)

    let page = 0
    const curPage = await interaction.editReply({
      flags: 32768,
      components: [...this.pages[page], row.toJSON()],
    })

    const collector = curPage.createMessageComponentCollector({
      filter: (m) => m.user.id === interaction.user.id,
      time: this.timeout,
      componentType: ComponentType.Button,
    })

    collector.on('collect', async (i) => {
      if (!i.deferred) await i.deferUpdate()

      if (i.customId === 'back') {
        page = page > 0 ? --page : this.pages.length - 1
      } else if (i.customId === 'next') {
        page = page + 1 < this.pages.length ? ++page : 0
      }
      curPage
        .edit({
          flags: 32768,
          components: [...this.pages[page], row.toJSON()],
        })
        .catch(() => null)
    })

    collector.on('end', () => {
      const disabled = new ActionRowBuilder<ButtonBuilder>().addComponents(
        row1.setDisabled(true),
        row2.setDisabled(true)
      )
      curPage
        .edit({
          flags: 32768,
          components: [...this.pages[page], disabled.toJSON()],
        })
        .catch(() => null)
      // @ts-ignore
      collector.removeAllListeners()
    })

    return curPage
  }

  async prefixPage(message: Message) {
    if (!message && !(message as Message).channel) throw new Error('Channel is inaccessible.')
    if (!this.pages) throw new Error('Pages are not given.')
    if (this.pages.length == 0) return

    const row1 = new ButtonBuilder()
      .setCustomId('back')
      .setLabel('←')
      .setStyle(ButtonStyle.Secondary)
    const row2 = new ButtonBuilder()
      .setCustomId('next')
      .setLabel('→')
      .setStyle(ButtonStyle.Secondary)
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(row1, row2)

    let page = 0
    const curPage = await message.reply({
      flags: 32768,
      components: [...this.pages[page], row.toJSON()],
      allowedMentions: { repliedUser: false },
    })

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
      const route = `/channels/${curPage.channel.id}/messages/${curPage.id}` as any
      this.client.rest
        .patch(route, {
          body: { components: [...this.pages[page], row.toJSON()], flags: 32768 },
        } as any)
        .catch(() => null)
    })
    collector.on('end', () => {
      const disabled = new ActionRowBuilder<ButtonBuilder>().addComponents(
        row1.setDisabled(true),
        row2.setDisabled(true)
      )
      const route = `/channels/${curPage.channel.id}/messages/${curPage.id}` as any
      this.client.rest
        .patch(route, {
          body: { components: [...this.pages[page], disabled.toJSON()], flags: 32768 },
        } as any)
        .catch(() => null)
      // @ts-ignore
      collector.removeAllListeners()
    })
    return curPage
  }
}
