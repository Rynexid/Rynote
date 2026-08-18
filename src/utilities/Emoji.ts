import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const raw = readFileSync(join(__dirname, '..', '..', 'emoji.json'), 'utf-8')

export const EMOJI = JSON.parse(raw) as {
  player: Record<string, string>
  global: Record<string, string>
  category: Record<string, string>
  user: Record<string, string>
  brand: Record<string, string>
  banner: string
}
