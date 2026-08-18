import MarkdownIt from 'markdown-it'
var md = new MarkdownIt()
import Token from 'markdown-it/lib/token.js'

export class GetLavalinkServer {
  async execute() {
    // External Lavalink list (disabled — using local Lavalink instead)
    // const resJson = await this.fetchWithTimeout(
    //   'https://raw.githubusercontent.com/DarrenOfficial/lavalink-list/master/docs/NoSSL/Lavalink-NonSSL.md',
    //   8000
    // )
    // const externalNodes = this.getLavalinkServerInfo(resJson)

    // const customNodes = [
    //   {
    //     host: 'lava-v4.ajieblogs.eu.org',
    //     port: 443,
    //     pass: 'https://dsc.gg/ajidevserver',
    //     secure: true,
    //     name: 'lava-v4.ajieblogs.eu.org:443',
    //     online: false,
    //   },
    //   {
    //     host: 'lavalinkv4.serenetia.com',
    //     port: 443,
    //     pass: 'https://seretia.link/discord',
    //     secure: true,
    //     name: 'lavalinkv4.serenetia.com:443',
    //     online: false,
    //   },
    // ]

    // return [...customNodes, ...externalNodes]

    const localNodes = [
      {
        host: 'localhost',
        port: 2333,
        pass: 'rynote',
        secure: false,
        name: 'localhost:2333',
        online: false,
      },
    ]

    return localNodes
  }

  async fetchWithTimeout(url: string, timeout: number): Promise<string> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      return await res.text()
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }
  }

  getLavalinkServerInfo(data: string): any[] {
    const MdCodeTagFilter: string[] = []

    var result = md.parse(data, '')

    result.filter((data: Token) => {
      if (data.tag == 'code') {
        MdCodeTagFilter.push(data.content)
      }
    })

    const lavalinkCredentailsFilter = this.parseData(MdCodeTagFilter)
    const final = this.commitData(lavalinkCredentailsFilter)

    return final
  }

  parseBoolean(value: string) {
    if (typeof value === 'string') {
      value = value.trim().toLowerCase()
    }
    switch (value) {
      case 'true':
        return true
      default:
        return false
    }
  }

  parseData(MdCodeTagFilter: string[]) {
    const LavalinkCredentailsFilter: string[] = []
    for (let i = 0; i < MdCodeTagFilter.length; i++) {
      const element = MdCodeTagFilter[i]
      // Phrase data
      const res = element.replace(/\n/g, '')
      const res2 = res.replace(/\s+/g, '')
      const res3 = res2.replace(/Host/g, '')
      const res4 = res3.replace(/Port/g, '')
      const res5 = res4.replace(/Password/g, '')
      const res6 = res5.replace(/Secure/g, '')
      const res7 = res6.replace(/[&\/\\#,+()$~%'"*?<>{}]/g, '')
      LavalinkCredentailsFilter.push(res7)
    }
    return LavalinkCredentailsFilter
  }

  commitData(LavalinkCredentailsFilter: string[]): any[] {
    const FinalData = []
    for (let i = 0; i < LavalinkCredentailsFilter.length; i++) {
      const regexExtract = /:(.{0,99999}):([0-9]{0,99999}):(.{0,99999}):(false|true)/
      const element = LavalinkCredentailsFilter[i]
      const res = regexExtract.exec(element)
      res
        ? FinalData.push({
            host: res![1],
            port: Number(res![2]),
            pass: res![3],
            secure: this.parseBoolean(res![4]),
            name: `${res![1]}:${Number(res![2])}`,
            online: false,
          })
        : true
    }
    return FinalData
  }
}

// function parseBoolean(value: string) {
//   if (typeof value === "string") {
//     value = value.trim().toLowerCase();
//   }
//   switch (value) {
//     case "true":
//       return true;
//     default:
//       return false;
//   }
// }

// export default async () => {

// };
