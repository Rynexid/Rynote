import sharp from 'sharp'

const CARD_W = 800
const CARD_H = 320
const AV_SIZE = 138
const RING = 7
const PAD = 22

function svgCircle(size: number, strokeWidth = 0): Buffer {
  const r = size / 2 - (strokeWidth ? strokeWidth / 2 : 0)
  const stroke = strokeWidth
    ? `stroke='white' stroke-width='${strokeWidth}' fill='none'`
    : `fill='white'`
  return Buffer.from(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${size / 2}' cy='${size / 2}' r='${r}' ${stroke}/></svg>`
  )
}

function fallbackCover(): Promise<Buffer> {
  const svg = Buffer.from(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='320'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0%' stop-color='#5865F2'/><stop offset='100%' stop-color='#23272A'/>` +
      `</linearGradient></defs><rect width='800' height='320' fill='url(#g)'/></svg>`
  )
  return sharp(svg).png().toBuffer()
}

export interface CardInput {
  cover?: Buffer | null
  avatar: Buffer
}

/**
 * Composite the user's avatar (circular, ringed) floating at the bottom-left
 * over their cover banner, mimicking the Discord profile popout layout.
 * Returns a PNG buffer, or null when the avatar buffer is unusable.
 */
export async function buildProfileCard({ cover, avatar }: CardInput): Promise<Buffer | null> {
  try {
    if (!avatar) return null
    const coverBuf = cover ?? (await fallbackCover())

    const mask = svgCircle(AV_SIZE)
    const cirSvg = svgCircle(AV_SIZE + RING * 2, RING)

    const ring = await sharp({
      create: {
        width: AV_SIZE + RING * 2,
        height: AV_SIZE + RING * 2,
        channels: 4,
        background: '#ffffff',
      },
    })
      .composite([{ input: cirSvg, blend: 'dest-in' }])
      .png()
      .toBuffer()

    const circle = await sharp(avatar)
      .resize(AV_SIZE, AV_SIZE, { fit: 'cover' })
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer()

    const top = CARD_H - (AV_SIZE + RING * 2) - PAD

    const card = await sharp(coverBuf)
      .resize(CARD_W, CARD_H, { fit: 'cover' })
      .composite([
        { input: ring, top, left: PAD },
        { input: circle, top: top + RING, left: PAD + RING },
      ])
      .png()
      .toBuffer()

    return card
  } catch {
    return null
  }
}
