import { ApplicationCommandOptionType } from 'discord.js'
import voucher_codes from 'voucher-code-generator'
import { Accessableby, Command } from '../../../structures/Command.js'
import { CommandHandler } from '../../../structures/CommandHandler.js'
import { Manager } from '../../../manager.js'
import { buildV2 } from '../../../utilities/V2.js'
import { RYNOTE_BANNER_URL } from '../../../utilities/Links.js'

const GREEN = 0x57f287
const RED = 0xed4245

export default class implements Command {
  public name = ['pmgenerate']
  public description = 'Generate a premium code!'
  public category = 'Premium'
  public accessableby = [Accessableby.Admin]
  public usage = '<type> <number>'
  public aliases = ['pmg']
  public lavalink = false
  public playerCheck = false
  public usingInteraction = true
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'plan',
      description: 'Avalible: daily, weekly, monthly, yearly',
      required: true,
      type: ApplicationCommandOptionType.String,
      choices: [
        {
          name: 'Daily',
          value: 'daily',
        },
        {
          name: 'Weekly',
          value: 'weekly',
        },
        {
          name: 'Monthly',
          value: 'monthly',
        },
        {
          name: 'Yearly',
          value: 'yearly',
        },
        {
          name: 'Lifetime',
          value: 'lifetime',
        },
      ],
    },
    {
      name: 'amount',
      description: 'The amount of code you want to generate',
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    const L = (key: string, args?: Record<string, string>) =>
      client.i18n.get(handler.language, 'command.premium', key, args)

    const plans = this.options[0].choices!.map((data) => data.value)
    const name = handler.args[0]
    const camount = Number(handler.args[1])

    if (!name || !plans.includes(name))
      return handler.replyV2(
        buildV2({
          color: RED,
          description: `${client.i18n.get(handler.language, 'error', 'arg_error', {
            text: '**daily**, **weekly**, **monthly**, **yearly**, **lifetime**!',
          })}`,
        })
      )
    if (!camount)
      return handler.replyV2(
        buildV2({
          color: RED,
          description: `${client.i18n.get(handler.language, 'error', 'arg_error', {
            text: '**Number**!',
          })}`,
        })
      )

    const codes = []

    const plan = name

    let time: number | 'lifetime'
    switch (plan) {
      case 'daily':
        time = Date.now() + 86400000
        break
      case 'weekly':
        time = Date.now() + 86400000 * 7
        break
      case 'monthly':
        time = Date.now() + 86400000 * 30
        break
      case 'yearly':
        time = Date.now() + 86400000 * 365
        break
      case 'lifetime':
        time = 'lifetime'
        break
    }

    let amount = camount
    if (!amount) amount = 1

    for (let i = 0; i < amount; i++) {
      const codePremium = voucher_codes.generate({
        pattern: '#############-#########-######',
      })

      const code = codePremium.toString().toUpperCase()
      const find = await client.db.code.get(`${code}`)

      if (!find) {
        await client.db.code.set(`${code}`, {
          code: code,
          plan: plan,
          expiresAt: time,
        })
        codes.push(`${i + 1} - ${code}`)
      }
    }

    const expires = time == 'lifetime' ? L('premium_lifetime') : `<t:${(time / 1000).toFixed()}:F>`

    const container = {
      type: 17,
      accent_color: typeof client.color === 'number' ? client.color : undefined,
      components: [
        { type: 10, content: `# 🔑 ${L('gen_author')}` },
        {
          type: 12,
          items: [{ media: { url: RYNOTE_BANNER_URL }, description: client.user!.username }],
        },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 10,
          content:
            `- **${L('premium_field_amount')}:** \`${codes.length}\`\n` +
            `- **${L('premium_field_plan')}:** \`${plan}\`\n` +
            `- **${L('premium_field_expires')}:** ${expires}`,
        },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 10,
          content: '```' + codes.join('\n') + '```',
        },
        {
          type: 10,
          content: `*${L('gen_footer', { prefix: '/' })}*`,
        },
      ],
    }

    const embedMes = (pass: boolean) =>
      buildV2({
        color: pass ? GREEN : RED,
        description: L(pass ? 'gen_success' : 'gen_failed'),
      })

    const getDM = await handler.user.createDM(true)
    if (!getDM) return handler.replyV2(embedMes(false))
    if (!getDM.isDMBased()) return handler.replyV2(embedMes(false))
    await getDM.send({ flags: 32768, components: [container] } as any)
    await handler.replyV2(embedMes(true))
  }
}
