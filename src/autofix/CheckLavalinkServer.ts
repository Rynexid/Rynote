import { Manager } from '../manager.js'
import { Headers } from '../@types/Lavalink.js'
import { GetLavalinkServer } from './GetLavalinkServer.js'
import { RainlinkWebsocket } from 'rainlink'

export class CheckLavalinkServer {
  client: Manager
  constructor(client: Manager, isLogEnable: boolean = true) {
    this.client = client
    this.execute(isLogEnable)
  }

  async execute(isLogEnable: boolean) {
    if (isLogEnable)
      this.client.logger.info(
        CheckLavalinkServer.name,
        'Running check lavalink server from [https://lavalink.darrennathanael.com/] source'
      )

    const getLavalinkServerClass = new GetLavalinkServer()

    const lavalink_data = await getLavalinkServerClass.execute()

    if (this.client.lavalinkList.length !== 0) this.client.lavalinkList.length = 0

    const checkPromises = lavalink_data.map((config) => {
      let headers = {
        'Client-Name': 'rynote/1.0.0 (https://github.com/Rynote/rynote)',
        'User-Agent': 'rynote/1.0.0 (https://github.com/Rynote/rynote)',
        Authorization: config.pass,
        'User-Id': '977148321682575410',
        'Resume-Key': 'rynote@1.0.0(https://github.com/Rynote/rynote)',
      }

      const protocol = config.secure ? 'wss' : 'ws'
      const url = `${protocol}://${config.host}:${config.port}/v4/websocket`

      return this.checkServerStatus(url, headers)
        .then(() => {
          this.client.lavalinkList.push({
            host: config.host,
            port: config.port,
            pass: config.pass,
            secure: config.secure,
            name: `${config.host}:${config.port}`,
            online: true,
          })
        })
        .catch(() => {
          this.client.lavalinkList.push({
            host: config.host,
            port: config.port,
            pass: config.pass,
            secure: config.secure,
            name: `${config.host}:${config.port}`,
            online: false,
          })
        })
    })

    await Promise.all(checkPromises)
  }

  checkServerStatus(url: string, headers: Headers) {
    return new Promise((resolve, reject) => {
      const ws = new RainlinkWebsocket(url, { headers })
      const timeout = setTimeout(() => {
        ws.close()
        reject(new Error('Connection timeout'))
      }, 5000)

      ws.on('open', () => {
        clearTimeout(timeout)
        resolve(true)
        ws.close()
      })
      ws.on('error', (e) => {
        clearTimeout(timeout)
        reject(e)
      })
    })
  }
}
