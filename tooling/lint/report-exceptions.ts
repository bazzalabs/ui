/**
 * Prints every lint exception in `packages/react`: each rule's allowlist in
 * `.oxlintrc.json`, rules turned off by pattern, and every inline
 * `oxlint-disable` comment with its reason. The counts are for people to
 * watch and burn down, not a gate.
 *
 * It does fail (exit 1) on a malformed exception: no rule named, no reason, a
 * file-wide `bazza/*` exception, or `eslint-disable`. That check has to live
 * here too, because a bare `/* oxlint-disable *\/` can also silence
 * `bazza/disable-needs-reason`, the lint rule meant to catch it, and a text
 * scan can't be silenced.
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { directiveProblem, parseDirective } from './bazza-plugin.mjs'
import { comments, readOxlintConfig, repoRoot } from './source-text.ts'

/** The extensions oxlint lints in `packages/react` (see `.oxlintrc.json`). */
const extensions = ['ts', 'tsx', 'mts', 'cts', 'js', 'jsx', 'mjs', 'cjs']

export interface InlineException {
  readonly file: string
  readonly line: number
  readonly tool: 'oxlint' | 'eslint'
  readonly rules: readonly string[]
  readonly reason: string
  readonly problem: string | null
}

export interface Allowlist {
  readonly rule: string
  readonly files: readonly string[]
}

export interface PatternOff {
  readonly files: readonly string[]
  readonly rules: readonly string[]
}

/** Every `oxlint-disable` / `eslint-disable` comment in `files`. */
export function findInlineExceptions(
  files: readonly string[],
  read: (file: string) => string,
): InlineException[] {
  const found: InlineException[] = []
  for (const file of files) {
    for (const comment of comments(read(file))) {
      const parsed = parseDirective(comment.value)
      if (parsed?.action !== 'disable') continue
      found.push({
        file,
        line: comment.line,
        tool: parsed.tool === 'eslint' ? 'eslint' : 'oxlint',
        rules: parsed.rules,
        reason: parsed.reason,
        problem: directiveProblem(parsed),
      })
    }
  }
  return found
}

interface Override {
  files?: string[]
  rules?: Record<string, unknown>
}

/** oxlint's spellings of "off". */
function isOff(level: unknown): boolean {
  if (Array.isArray(level)) return isOff(level[0])
  return level === 'off' || level === 'allow' || level === 0
}

const isPattern = (path: string) => /[*?{[]/.test(path)

/**
 * The exceptions a config grants: allowlists (rules turned off for literal
 * file paths) and rules turned off by pattern (like the override that exempts
 * tests from the part rules).
 */
export function findConfigExceptions(config: { overrides?: Override[] }): {
  allowlists: Allowlist[]
  patterns: PatternOff[]
} {
  const allowlisted = new Map<string, Set<string>>()
  const patterns: PatternOff[] = []
  for (const override of config.overrides ?? []) {
    const files = override.files ?? []
    const off = Object.entries(override.rules ?? {})
      .filter(([, level]) => isOff(level))
      .map(([rule]) => rule)
    if (files.length === 0 || off.length === 0) continue
    const literal = files.filter((file) => !isPattern(file))
    const patterned = files.filter(isPattern)
    for (const rule of off) {
      const set = allowlisted.get(rule) ?? new Set<string>()
      for (const file of literal) set.add(file)
      if (literal.length > 0) allowlisted.set(rule, set)
    }
    if (patterned.length > 0) patterns.push({ files: patterned, rules: off })
  }
  const allowlists = [...allowlisted]
    .map(([rule, set]) => ({ rule, files: [...set].sort() }))
    .sort((a, b) => a.rule.localeCompare(b.rule))
  return { allowlists, patterns }
}

/**
 * The malformed exceptions that fail the report. An `eslint-disable` comment
 * in a file allowlisted for `bazza/disable-needs-reason` is on the burn-down
 * list already, and oxlint ignores it, so it doesn't count. A malformed
 * `oxlint-disable` always counts: it can silence rules.
 */
export function brokenExceptions(
  allowlists: readonly Allowlist[],
  inline: readonly InlineException[],
): Set<InlineException> {
  const exempt = new Set(
    allowlists.find((a) => a.rule === 'bazza/disable-needs-reason')?.files,
  )
  return new Set(
    inline.filter(
      (exception) =>
        exception.problem &&
        !(exception.tool === 'eslint' && exempt.has(exception.file)),
    ),
  )
}

/** The report as lines of text. */
export function formatReport(
  { allowlists, patterns }: { allowlists: Allowlist[]; patterns: PatternOff[] },
  inline: readonly InlineException[],
  broken: ReadonlySet<InlineException>,
  exists: (file: string) => boolean,
): string[] {
  const entries = allowlists.reduce((sum, a) => sum + a.files.length, 0)
  const files = new Set(allowlists.flatMap((a) => a.files)).size
  const lines = [
    `Lint exceptions in packages/react: ${entries} allowlist entries across ${files} file(s), ${inline.length} inline.`,
    '',
    'Allowlisted files, by rule (fix a file, then delete its line in .oxlintrc.json):',
  ]
  for (const { rule, files: listed } of allowlists) {
    lines.push(`  ${rule} (${listed.length})`)
    for (const file of listed) {
      lines.push(
        `    ${file}${exists(file) ? '' : '  (file no longer exists)'}`,
      )
    }
  }
  lines.push('', 'Rules turned off by pattern:')
  if (patterns.length === 0) lines.push('  none')
  for (const pattern of patterns) {
    lines.push(`  ${pattern.files.join(', ')}: ${pattern.rules.join(', ')}`)
  }
  lines.push('', 'Inline exceptions:')
  if (inline.length === 0) lines.push('  none')
  for (const exception of inline) {
    const rules = exception.rules.join(', ') || '(all rules)'
    const reason = exception.reason || '(no reason)'
    const mark = !exception.problem
      ? ''
      : broken.has(exception)
        ? `  ✗ ${exception.problem}`
        : `  (allowlisted) ${exception.problem}`
    lines.push(
      `  ${exception.file}:${exception.line}  ${rules}  -- ${reason}${mark}`,
    )
  }
  if (broken.size > 0) {
    lines.push(
      '',
      `${broken.size} lint exception(s) aren't acceptable; see ✗ above and "Lint" in packages/react/AGENTS.md.`,
    )
  }
  return lines
}

/** Tracked source files in `packages/react` that exist in the working tree. */
function sourceFiles(): string[] {
  const out = execFileSync(
    'git',
    [
      'ls-files',
      '-z',
      '--',
      ...extensions.map((ext) => `packages/react/*.${ext}`),
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  )
  return out
    .split('\0')
    .filter((file) => file && existsSync(join(repoRoot, file)))
}

if ((import.meta as { main?: boolean }).main) {
  const config = findConfigExceptions(readOxlintConfig())
  const inline = findInlineExceptions(sourceFiles(), (file) =>
    readFileSync(join(repoRoot, file), 'utf8'),
  )
  const broken = brokenExceptions(config.allowlists, inline)
  const lines = formatReport(config, inline, broken, (file) =>
    existsSync(join(repoRoot, file)),
  )
  console.log(lines.join('\n'))
  const summary = process.env.GITHUB_STEP_SUMMARY
  if (summary) {
    appendFileSync(
      summary,
      `## Lint exceptions\n\n\`\`\`text\n${lines.join('\n')}\n\`\`\`\n`,
    )
  }
  if (broken.size > 0) process.exitCode = 1
}
