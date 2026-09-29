import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { readOxlintConfig } from './source-text.ts'

const run = promisify(execFile)
const here = dirname(fileURLToPath(import.meta.url))
const oxlint = join(here, 'node_modules/.bin/oxlint')
const bazzaPlugin = join(here, 'bazza-plugin.mjs')

export interface Finding {
  readonly rule: string
  readonly file: string
  readonly line: number
  readonly message: string
}

type Files = Readonly<Record<string, string>>

interface Diagnostic {
  code: string
  filename: string
  message: string
  labels: { span: { line: number } }[]
}

/** Writes `config` and `files` to a temp dir and runs oxlint there. */
async function inTempDir<T>(
  config: object,
  files: Files,
  use: (dir: string) => Promise<T>,
): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'bazza-lint-'))
  try {
    await writeFile(join(dir, '.oxlintrc.json'), JSON.stringify(config))
    for (const [path, source] of Object.entries(files)) {
      await mkdir(dirname(join(dir, path)), { recursive: true })
      await writeFile(join(dir, path), source)
    }
    return await use(dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/** Runs oxlint in `dir`. It exits 1 when it finds errors, so stdout is what matters. */
function oxlintIn(dir: string, args: string[]): Promise<string> {
  return run(oxlint, ['--disable-nested-config', ...args, '.'], { cwd: dir })
    .then(({ stdout }) => stdout)
    .catch((error: { stdout?: string }) => error.stdout ?? '')
}

/** Lints `files` with `config` and returns the findings, sorted by file and line. */
function lintIn(config: object, files: Files): Promise<Finding[]> {
  return inTempDir(config, files, async (dir) => {
    const parsed = JSON.parse(await oxlintIn(dir, ['--format', 'json'])) as {
      diagnostics: Diagnostic[]
    }
    return parsed.diagnostics
      .map((d) => ({
        rule: d.code,
        file: d.filename,
        line: d.labels[0]?.span.line ?? 0,
        message: d.message,
      }))
      .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
  })
}

/** A config with one rule switched on everywhere. */
const oneRule = (rule: string) => ({
  plugins: ['react'],
  categories: { correctness: 'off' },
  jsPlugins: [bazzaPlugin],
  rules: { [rule]: 'error' },
})

/** Lints `files` with one rule switched on everywhere, e.g. `bazza/use-client`. */
export function lintWith(rule: string, files: Files): Promise<Finding[]> {
  return lintIn(oneRule(rule), files)
}

/** Runs `oxlint --fix` with one rule switched on and returns the fixed file. */
export function fixWith(
  rule: string,
  path: string,
  source: string,
): Promise<string> {
  return inTempDir(oneRule(rule), { [path]: source }, async (dir) => {
    await oxlintIn(dir, ['--fix'])
    return readFile(join(dir, path), 'utf8')
  })
}

/** The repo's `.oxlintrc.json`, with the plugin path made absolute. */
function repoConfig(): object {
  const config = readOxlintConfig()
  delete config.$schema
  config.jsPlugins = [bazzaPlugin]
  return config
}

/**
 * Lints `files` laid out at repo paths with the repo's own `.oxlintrc.json`,
 * so the tests see the same scoping CI does.
 */
export function lintWithRepoConfig(files: Files): Promise<Finding[]> {
  return lintIn(repoConfig(), files)
}
