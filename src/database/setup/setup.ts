import { Manager } from '../../manager.js'
import { RYNOTE_BANNER_URL } from '../../utilities/Links.js'
import { setupPlayerButtons } from '../../utilities/SetupPlayerButtons.js'
import { Setup } from '../schema/Setup.js'
import { TextChannel } from 'discord.js'

export class SongRequesterCleanSetup {
  client: Manager
  constructor(client: Manager) {
    this.client = client
    this.execute()
  }

  async execute() {
    const guilds = await this.client.db.setup.all()

    for (let data of guilds) {
      const extractData = data.value
      const player = this.client.rainlink.players.get(extractData.guild)
      if (!extractData.enable) return
      if (player) return
      await this.restore(extractData)
    }
  }

  async restore(setupData: Setup) {
    let channel = (await this.client.channels
      .fetch(setupData.channel)
      .catch(() => undefined)) as TextChannel
    if (!channel) return

    let playMsg = await channel.messages.fetch(setupData.playmsg).catch(() => undefined)
    if (!playMsg) return

    let guildModel = await this.client.db.language.get(`${setupData.guild}`)
    if (!guildModel) {
      guildModel = await this.client.db.language.set(
        `${setupData.guild}`,
        this.client.config.bot.LANGUAGE
      )
    }

    const language = guildModel

    const queueMsg = `${this.client.i18n.get(language, 'event.setup', 'setup_queuemsg')}`
    const playAuthor = `${this.client.i18n.get(language, 'event.setup', 'setup_playembed_author')}`

    return await playMsg
      .edit({
        flags: 32768,
        content: ' ',
        components: [
          {
            type: 17,
            accent_color: this.client.color,
            components: [
              {
                type: 12,
                items: [{ media: { url: RYNOTE_BANNER_URL }, description: playAuthor }],
              },
              { type: 10, content: `## ${playAuthor}` },
              { type: 10, content: queueMsg },
              setupPlayerButtons(this.client),
            ],
          },
        ],
      })
      .catch((e) => {})
  }
}
