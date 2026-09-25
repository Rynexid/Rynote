import type { Manager } from '../manager.js'

const parseEmoji = (emoji: string): Record<string, string> => {
  const match = emoji.match(/^<(a)?:(\w+):(\d+)>$/)
  if (match) {
    const result: Record<string, string> = { name: match[2], id: match[3] }
    if (match[1]) result.animated = 'true'
    return result
  }
  return { name: emoji }
}

export const setupPlayerButtons = (client: Manager) => [
  {
    type: 1,
    components: [
      {
        type: 2,
        style: 2,
        custom_id: 'replay',
        emoji: parseEmoji(client.config.emojis.PLAYER.previous),
      },
      {
        type: 2,
        style: 2,
        custom_id: 'volup',
        emoji: parseEmoji(client.config.emojis.PLAYER.volup),
      },
      {
        type: 2,
        style: 2,
        custom_id: 'pause',
        emoji: parseEmoji(client.config.emojis.PLAYER.pause),
      },
    ],
  },
  {
    type: 1,
    components: [
      {
        type: 2,
        style: 2,
        custom_id: 'voldown',
        emoji: parseEmoji(client.config.emojis.PLAYER.voldown),
      },
      {
        type: 2,
        style: 2,
        custom_id: 'skip',
        emoji: parseEmoji(client.config.emojis.PLAYER.skip),
      },
      {
        type: 2,
        style: 2,
        custom_id: 'clear',
        emoji: parseEmoji(client.config.emojis.PLAYER.delete),
      },
    ],
  },
]
