import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const RYNOTE_BANNER_PATH = join(__dirname, '..', '..', 'assets', 'banner.png')
export const RYNOTE_BANNER_URL = 'attachment://banner.png'
export const RYNOTE_BANNER_FILE = { attachment: RYNOTE_BANNER_PATH, name: 'banner.png' }
