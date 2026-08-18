import readdirRecursive from 'recursive-readdir'
import { resolve, relative } from 'path'
import { Manager } from '../../manager.js'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { KeyCheckerEnum } from '../../@types/KeyChecker.js'
import { Command } from '../../structures/Command.js'
const __dirname = dirname(fileURLToPath(import.meta.url))

export class CommandLoader {
  client: Manager
  constructor(client: Manager) {
    this.client = client
    this.loader()
  }

  async loader() {
    const slashPath = resolve(join(__dirname, '..', '..', 'commands', 'slash'))
    const prefixPath = resolve(join(__dirname, '..', '..', 'commands', 'prefix'))

    let slashFiles = await readdirRecursive(slashPath)
    let prefixFiles = await readdirRecursive(prefixPath)

    for await (const commandFile of slashFiles) {
      await this.register(commandFile)
    }
    for await (const commandFile of prefixFiles) {
      await this.register(commandFile)
    }

    const commandColl = this.client.commands
    const prefixColl = this.client.prefixCommands

    this.client.logger.info(CommandLoader.name, `Command Load Results:`)
    this.client.logger.info(CommandLoader.name, `├── ${commandColl.size} Slash Commands`)
    this.client.logger.info(CommandLoader.name, `├── ${prefixColl.size} Prefix Commands`)
    this.client.logger.info(
      CommandLoader.name,
      `└── Total ${commandColl.size + prefixColl.size} Command Loaded!`
    )
  }

  async register(commandFile: string) {
    const rltPath = relative(__dirname, commandFile)
    const command = new (await import(pathToFileURL(commandFile).toString())).default()

    if (!command.name?.length) {
      this.client.logger.warn(
        CommandLoader.name,
        `"${rltPath}" The command file does not have a name. Skipping...`
      )
      return
    }

    const key = command.name.join('-')

    if (this.client.commands.has(key) || this.client.prefixCommands.has(key)) {
      this.client.logger.warn(
        CommandLoader.name,
        `"${key}" command has already been installed. Skipping...`
      )
      return
    }

    const checkRes = this.keyChecker(command)

    if (checkRes !== KeyCheckerEnum.Pass) {
      this.client.logger.warn(
        CommandLoader.name,
        `"${key}" command is not implements correctly [${checkRes}]. Skipping...`
      )
      return
    }

    this.client.commands.set(key, command)
    this.client.prefixCommands.set(key, command)

    if (command.aliases && command.aliases.length !== 0) {
      command.aliases.forEach((a: string) => {
        this.client.aliases.set(a, key)
        this.client.aliasesPrefix.set(a, key)
      })
    }
  }

  keyChecker(obj: Record<string, any>): KeyCheckerEnum {
    const base = new Command()
    const baseKeyArray = Object.keys(base)
    const check = Object.keys(obj)
    const checkedKey: string[] = []

    if (baseKeyArray.length > check.length) return KeyCheckerEnum.MissingKey
    if (baseKeyArray.length < check.length) return KeyCheckerEnum.TooMuchKey
    if (obj.execute == undefined) return KeyCheckerEnum.NoRunFunction

    try {
      for (let i = 0; i < check.length; i++) {
        if (checkedKey.includes(check[i])) return KeyCheckerEnum.DuplicateKey
        if (!(check[i] in base)) return KeyCheckerEnum.InvalidKey
        checkedKey.push(check[i])
      }
    } finally {
      checkedKey.length = 0
      return KeyCheckerEnum.Pass
    }
  }
}
