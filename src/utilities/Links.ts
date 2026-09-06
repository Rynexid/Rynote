export const RYNOTE_INVITE =
  'https://discord.com/oauth2/authorize?client_id=1496804643530080376&permissions=4855449856833872&integration_type=0&scope=bot+applications.commands'

export const RYNOTE_SUPPORT = 'https://discord.gg/MsxdNeExdg'
export const RYNOTE_GITHUB = 'https://github.com/Rynexid'
export const RYNOTE_BANNER_CDN = 'https://s6.imgcdn.dev/Y8V7Xy.png'

const RYNOTE_BANNER_PATH = new URL('../../assets/banner.png', import.meta.url).pathname
export const RYNOTE_BANNER_URL = 'attachment://banner.png'
export const RYNOTE_BANNER_FILE = { attachment: RYNOTE_BANNER_PATH, name: 'banner.png' }