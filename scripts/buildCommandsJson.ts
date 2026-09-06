import readdirRecursive from 'recursive-readdir'
import { resolve, join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { writeFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(join(__dirname, '..'))
const slashPath = resolve(join(__dirname, '..', 'src', 'commands', 'slash'))
const prefixPath = resolve(join(__dirname, '..', 'src', 'commands', 'prefix'))

const optionTypeNames: Record<number, string> = {
  1: 'Subcommand',
  2: 'SubcommandGroup',
  3: 'String',
  4: 'Integer',
  5: 'Boolean',
  6: 'User',
  7: 'Channel',
  8: 'Role',
  9: 'Mentionable',
  10: 'Number',
  11: 'Attachment',
}

const optionTypeNumbers: Record<string, number> = {
  Subcommand: 1,
  SubcommandGroup: 2,
  String: 3,
  Integer: 4,
  Boolean: 5,
  User: 6,
  Channel: 7,
  Role: 8,
  Mentionable: 9,
  Number: 10,
  Attachment: 11,
}

function normalizeOption(option: any) {
  return {
    name: option.name,
    description: option.description,
    type:
      typeof option.type === 'number' ? optionTypeNames[option.type] ?? String(option.type) : option.type,
    required: Boolean(option.required),
    autocomplete: Boolean(option.autocomplete),
    choices: option.choices ?? [],
  }
}

function normalizeCommand(command: any, source: 'slash' | 'prefix') {
  return {
    source,
    name: command.name ?? [],
    key: (command.name ?? []).join('-'),
    description: command.description ?? '',
    category: command.category ?? '',
    accessableby: command.accessableby ?? [],
    usage: command.usage ?? '',
    aliases: command.aliases ?? [],
    lavalink: Boolean(command.lavalink),
    playerCheck: Boolean(command.playerCheck),
    usingInteraction: Boolean(command.usingInteraction),
    sameVoiceCheck: Boolean(command.sameVoiceCheck),
    permissions: (command.permissions ?? []).map((p: bigint) => p.toString()),
    options: (command.options ?? []).map(normalizeOption),
  }
}

async function loadAll(files: string[], source: 'slash' | 'prefix') {
  const list: any[] = []
  for (const file of files) {
    try {
      const mod = await import(pathToFileURL(file).toString())
      const Ctor = mod.default
      if (typeof Ctor !== 'function') continue
      const instance = new Ctor()
      if (!instance?.name?.length) continue
      list.push(normalizeCommand(instance, source))
    } catch (err) {
      console.warn(`[skip] ${file}: ${(err as Error).message}`)
    }
  }
  return list
}

const [slashFiles, prefixFiles] = await Promise.all([
  readdirRecursive(slashPath),
  readdirRecursive(prefixPath),
])

const slash = await loadAll(slashFiles, 'slash')
const prefix = await loadAll(prefixFiles, 'prefix')

const output = {
  generatedAt: new Date().toISOString(),
  total: slash.length + prefix.length,
  slash: slash.length,
  prefix: prefix.length,
  commands: [...slash, ...prefix].sort((a, b) => a.key.localeCompare(b.key)),
}

const allCommands = [...slash, ...prefix].sort((a, b) => a.key.localeCompare(b.key))

const NAME_RE = /^[-_\u02BC\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u

function cleanName(name: string): string {
  let n = (name ?? '').toLowerCase().replace(/[\s/]+/g, '-').replace(/[^-_\u02BC\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]/gu, '')
  return n.slice(0, 32)
}

function cleanDescription(desc: string): string {
  return (desc ?? '').trim().slice(0, 100)
}

const warnings: string[] = []

function cleanCommands(c: any) {
  const options = (c.options ?? [])
    .filter((o: any) => o.name)
    .map((o: any, i: number) => {
      const warn = (msg: string) => warnings.push(`[${c.name.join('-')}/opt#${i + 1}] ${msg}`)
      if (o.description && o.description.length > 100) warn(`description ${o.description.length} chars (trimmed to 100)`)
      if (o.choices?.length > 25) warn(`choices ${o.choices.length} (trimmed to 25)`)
      if (o.choices?.some((ch: any) => (ch.name?.length ?? 0) > 100)) warn('choice name >100 chars')
      if (o.choices?.some((ch: any) => typeof ch.value === 'string' && ch.value.length > 100)) warn('choice value >100 chars (string)')
      return {
        type: optionTypeNumbers[o.type] ?? 3,
        name: cleanName(o.name),
        description: cleanDescription(o.description ?? `Parameter ${cleanName(o.name)}`),
        required: o.required === true,
        autocomplete: o.autocomplete === true,
        choices: o.choices?.length ? o.choices.slice(0, 25) : undefined,
      }
    })
    .sort((a: any, b: any) => Number(b.required) - Number(a.required))
    .slice(0, 25)
    .map((o: any) => {
      if (o.choices) {
        o.autocomplete = false
        o.choices = o.choices.map((ch: any) => ({ name: ch.name, value: ch.value }))
      } else if (o.autocomplete && ![3, 4, 10].includes(o.type)) {
        o.autocomplete = false
      }
      return o
    })

  if (options.length) {
    options.forEach((o: any) => {
      if (o.required === false) delete o.required
      if (o.autocomplete === false) delete o.autocomplete
    })
  }

  return options
}

const seenNames = new Map<string, string>()

const discordCommands = allCommands.map((c) => {
  const name = cleanName(c.name.join('-'))
  const description = cleanDescription(c.description || c.usage || 'No description yet')

  if (name.length < 1 || !NAME_RE.test(name)) {
    warnings.push(`[${c.name.join('-')}] cleaned name "${name}" fails Discord naming regex, skipped`)
    return null
  }
  const dup = seenNames.get(name)
  if (dup) {
    warnings.push(`[${c.name.join('-')}] duplicate final name "${name}" (also from ${dup}), skipped`)
    return null
  }
  seenNames.set(name, c.source)

  if (c.description.length > 100) warnings.push(`[${name}] description ${c.description.length} chars (trimmed to 100)`)

  const options = cleanCommands(c)
  const cmd: any = {
    name,
    description,
    type: 1,
  }
  if (options.length) cmd.options = options

  return cmd
})
  .filter((cmd): cmd is Record<string, unknown> => Boolean(cmd))
  .sort((a: any, b: any) => a.name.localeCompare(b.name))

writeFileSync(resolve(ROOT, 'commands.json'), JSON.stringify(output, null, 2) + '\n')
writeFileSync(resolve(ROOT, 'commands-import.json'), JSON.stringify(discordCommands, null, 2) + '\n')

console.log(`Generated commands.json (${output.total} commands: ${slash.length} slash, ${prefix.length} prefix)`)
console.log(`Generated commands-import.json (${discordCommands.length} commands, Discord import format)`)
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`)
  for (const w of warnings) console.log(`  - ${w}`)
}