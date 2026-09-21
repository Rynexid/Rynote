import { createCanvas, loadImage, CanvasRenderingContext2D, Image } from 'canvas'
import { formatDuration } from './FormatDuration.js'

const W = 1000
const H = 340
const PAD = 28
const ART = H - PAD * 2
const ART_X = PAD
const ART_Y = PAD
const TX = ART_X + ART + 36
const TW = W - TX - PAD

const BG_TOP = '#232428'
const BG_BOTTOM = '#17181c'
const ACCENT = '#5865F2'
const TEXT = '#ffffff'
const SUB = '#b9bbbe'
const MUTED = '#72767d'
const TRACK_BG = '#2b2d31'

export interface NowPlayingInput {
  title: string
  author?: string
  artworkUrl?: string | null
  duration: number
  position?: number
  sourceName?: string
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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines) break
    } else {
      line = test
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  const last = lines[maxLines - 1]
  if (last && ctx.measureText(last).width > maxWidth) {
    let cut = last
    while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1)
    lines[maxLines - 1] = `${cut}…`
  }
  return lines
}

/**
 * Render a "Now Playing" card (dark panel, artwork, title/author, progress bar).
 * Returns a PNG buffer, or null when rendering fails.
 */
export async function renderNowPlaying(input: NowPlayingInput): Promise<Buffer | null> {
  try {
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, BG_TOP)
    bg.addColorStop(1, BG_BOTTOM)
    ctx.fillStyle = bg
    roundRect(ctx, 0, 0, W, H, 16)
    ctx.fill()

    let artwork: Image | null = null
    if (input.artworkUrl) {
      try {
        artwork = await loadImage(input.artworkUrl)
      } catch {
        artwork = null
      }
    }

    if (artwork) {
      ctx.save()
      roundRect(ctx, ART_X, ART_Y, ART, ART, 16)
      ctx.clip()
      ctx.drawImage(artwork, ART_X, ART_Y, ART, ART)
      ctx.restore()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      roundRect(ctx, ART_X, ART_Y, ART, ART, 16)
      ctx.stroke()
    } else {
      const ph = ctx.createLinearGradient(ART_X, ART_Y, ART_X + ART, ART_Y + ART)
      ph.addColorStop(0, '#2b2d31')
      ph.addColorStop(1, '#1e1f22')
      ctx.fillStyle = ph
      roundRect(ctx, ART_X, ART_Y, ART, ART, 16)
      ctx.fill()
    }

    ctx.fillStyle = ACCENT
    ctx.font = '700 16px sans-serif'
    ctx.fillText('R Y N O T E', TX, ART_Y + 24)

    ctx.fillStyle = TEXT
    ctx.font = '700 34px sans-serif'
    const titleLines = wrapText(ctx, input.title, TW, 2)
    titleLines.forEach((line, i) => ctx.fillText(line, TX, ART_Y + 76 + i * 42))

    if (input.author) {
      ctx.fillStyle = SUB
      ctx.font = '500 22px sans-serif'
      ctx.fillText(input.author, TX, ART_Y + 150)
    }

    const progy = ART_Y + ART - 34
    const fraction =
      input.duration > 0 ? Math.min(Math.max((input.position ?? 0) / input.duration, 0), 1) : 0

    ctx.fillStyle = TRACK_BG
    roundRect(ctx, TX, progy, TW, 8, 4)
    ctx.fill()

    if (fraction > 0.003) {
      ctx.fillStyle = ACCENT
      roundRect(ctx, TX, progy, Math.max(TW * fraction, 8), 8, 4)
      ctx.fill()
    }

    ctx.fillStyle = MUTED
    ctx.font = '600 18px monospace'
    ctx.fillText(formatDuration(Math.floor(input.position ?? 0)), TX, progy + 26)
    ctx.textAlign = 'right'
    ctx.fillText(formatDuration(input.duration), TX + TW, progy + 26)
    ctx.textAlign = 'left'

    if (input.sourceName) {
      ctx.fillStyle = MUTED
      ctx.font = '600 18px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(input.sourceName, TX + TW, H - PAD)
      ctx.textAlign = 'left'
    }

    return canvas.toBuffer('image/png')
  } catch {
    return null
  }
}
