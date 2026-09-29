import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '../..')
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

/** Writes `files` and `config` to a temp dir, lints it, and returns the findings. */
async function lintIn(config: object, files: Files): Promise<Finding[]> {
  const dir = await mkdtemp(join(tmpdir(), 'bazza-lint-'))
  try {
    await writeFile(join(dir, '.oxlintrc.json'), JSON.stringify(config))
    for (const [path, source] of Object.entries(files)) {
      await mkdir(dirname(join(dir, path)), { recursive: true })
      await writeFile(join(dir, path), source)
    }
    // oxlint exits 1 when it finds errors; the JSON on stdout is what matters.
    const { stdout } = await run(
      oxlint,
      ['--disable-nested-config', '--format', 'json', '.'],
      { cwd: dir },
    ).catch((error: { stdout?: string }) => ({ stdout: error.stdout ?? '' }))
    const parsed = JSON.parse(stdout) as { diagnostics: Diagnostic[] }
    return parsed.diagnostics
      .map((d) => ({
        rule: d.code,
        file: d.filename,
        line: d.labels[0]?.span.line ?? 0,
        message: d.message,
      }))
      .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/** Lints `files` with one rule switched on everywhere, e.g. `bazza/use-client`. */
export function lintWith(rule: string, files: Files): Promise<Finding[]> {
  return lintIn(
    {
      plugins: ['react'],
      categories: { correctness: 'off' },
      jsPlugins: [bazzaPlugin],
      rules: { [rule]: 'error' },
    },
    files,
  )
}

/** The repo's `.oxlintrc.json`, with comments stripped and the plugin path made absolute. */
async function repoConfig(): Promise<object> {
  const raw = await readFile(join(repoRoot, '.oxlintrc.json'), 'utf8')
  const config = JSON.parse(raw.replace(/^\s*\/\/.*$/gm, ''))
  delete config.$schema
  config.jsPlugins = [bazzaPlugin]
  return config
}

/**
 * Lints `files` laid out at repo paths with the repo's own `.oxlintrc.json`,
 * so the tests see the same scoping CI does.
 */
export async function lintWithRepoConfig(files: Files): Promise<Finding[]> {
  return lintIn(await repoConfig(), files)
}
