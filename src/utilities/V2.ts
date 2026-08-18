import { ActionRowBuilder, ButtonBuilder, ColorResolvable, EmbedBuilder } from 'discord.js'

export function colorToInt(color: any): number | undefined {
  if (typeof color === 'number') return color
  if (typeof color === 'string') {
    const hex = color.replace('#', '')
    return parseInt(hex, 16)
  }
  return undefined
}

export interface V2Button {
  label: string
  url?: string
  style?: number
  customId?: string
}

export interface V2Data {
  title?: string
  description?: string
  color?: ColorResolvable
  fields?: { name: string; value: string; inline?: boolean }[]
  footer?: string
  thumbnail?: string
  image?: string
  buttons?: V2Button[][]
}

export function buildV2(data: V2Data): any[] {
  const components: any[] = []

  if (data.title) {
    components.push({ type: 10, content: `# ${data.title}` })
  }

  if (data.image) {
    components.push({
      type: 12,
      items: [{ media: { url: data.image }, description: data.title ?? 'image' }],
    })
  }

  if (data.description || (data.fields && data.fields.length)) {
    let body = data.description ?? ''
    if (data.fields && data.fields.length) {
      const grouped = data.fields.map((f) => `### ${f.name}\n${f.value}`).join('\n\n')
      body = body ? `${body}\n\n${grouped}` : grouped
    }
    components.push({ type: 10, content: body })
  }

  if (data.footer) {
    components.push({ type: 10, content: `*${data.footer}*` })
  }

  if (data.buttons && data.buttons.length) {
    for (const row of data.buttons) {
      const actionRow: any = {
        type: 1,
        components: row.map((b) => {
          const btn: any = {
            type: 2,
            label: b.label,
            style: b.style ?? (b.url ? 5 : 1),
          }
          if (b.url) btn.url = b.url
          if (b.customId) btn.custom_id = b.customId
          return btn
        }),
      }
      components.push(actionRow)
    }
  }

  const container: any = {
    type: 17,
    accent_color: colorToInt(data.color),
    components,
  }

  return [container]
}

export function embedToV2Data(embed: EmbedBuilder): V2Data {
  const data = embed.toJSON() as any
  const v2: V2Data = {}
  if (data.color) v2.color = data.color
  if (data.title) v2.title = data.title
  if (data.description) v2.description = data.description
  if (data.thumbnail?.url) v2.thumbnail = data.thumbnail.url
  if (data.image?.url) v2.image = data.image.url
  if (data.footer?.text) v2.footer = data.footer.text
  if (data.fields && data.fields.length) {
    v2.fields = data.fields.map((f: any) => ({
      name: f.name,
      value: f.value,
      inline: f.inline,
    }))
  }
  return v2
}
