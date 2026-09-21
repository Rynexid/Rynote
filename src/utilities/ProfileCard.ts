import { createCanvas, loadImage, Canvas, Image } from 'canvas'

const CARD_W = 800
const CARD_H = 320
const AV_SIZE = 138
const RING = 7
const PAD = 22

export interface CardInput {
  cover?: Buffer | null
  avatar: Buffer
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function gradient(): Canvas {
  const c = createCanvas(CARD_W, CARD_H)
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H)
  g.addColorStop(0, '#5865F2')
  g.addColorStop(1, '#23272A')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  return c
}

/**
 * Composite the user's avatar (circular, ringed) floating at the bottom-left
 * over their cover banner, mimicking the Discord profile popout layout.
 * Returns a PNG buffer, or null when canvas is unavailable or inputs are unusable.
 */
export async function buildProfileCard(input: CardInput): Promise<Buffer | null> {
  try {
    if (!input.avatar) return null

    let cover: Canvas | Image = gradient()
    try {
      if (input.cover) cover = await loadImage(input.cover)
    } catch {
      cover = gradient()
    }

    const avatarImg = await loadImage(input.avatar)

    const canvas = createCanvas(CARD_W, CARD_H)
    const ctx = canvas.getContext('2d')

    // Cover, cropped to fill
    const coverScale = Math.max(CARD_W / cover.width, CARD_H / cover.height)
    const cw = cover.width * coverScale
    const ch = cover.height * coverScale
    ctx.drawImage(cover, (CARD_W - cw) / 2, (CARD_H - ch) / 2, cw, ch)

    const disc = AV_SIZE + RING * 2
    const top = CARD_H - disc - PAD
    const left = PAD
    const cx = left + disc / 2
    const cy = top + disc / 2

    // Ring
    ctx.beginPath()
    ctx.arc(cx, cy, disc / 2, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()

    // Circular avatar inside the ring
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, AV_SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    const avatarScale = Math.max(AV_SIZE / avatarImg.width, AV_SIZE / avatarImg.height)
    const aw = avatarImg.width * avatarScale
    const ah = avatarImg.height * avatarScale
    ctx.drawImage(avatarImg, cx - aw / 2, cy - ah / 2, aw, ah)
    ctx.restore()

    return canvas.toBuffer('image/png')
  } catch {
    return null
  }
}
