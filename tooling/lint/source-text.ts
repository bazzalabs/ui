/**
 * Reading comments and JSONC from source text without a parser. Shared by the
 * exceptions report and the test harness.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

export interface Comment {
  /** The text between `//` and the line end, or between `/*` and `*\/`. */
  readonly value: string
  readonly start: number
  readonly end: number
  readonly line: number
}

/**
 * Every comment in `source`, skipping string and template literals, so a
 * `//` in a URL or a `/*` in a glob isn't mistaken for one. An apostrophe in
 * JSX text (`<p>Don't</p>`) doesn't open a string, and a quoted string ends at
 * the end of its line, since JS strings can't span lines.
 *
 * Known limits: regular expression literals and JSX text aren't recognised.
 * A quote after a non-word character (`<b>Bob</b>'s`) or a `//` in either can
 * hide the rest of that line; a `/*` in either can hide more.
 */
export function comments(source: string): Comment[] {
  const found: Comment[] = []
  // Template literals nest through `${ … }`; each entry counts open braces.
  const templateBraces: number[] = []
  let line = 1
  let i = 0
  const skipString = (quote: string) => {
    i++
    while (i < source.length && source[i] !== quote && source[i] !== '\n') {
      if (source[i] === '\\') {
        i++
        if (source[i] === '\n') line++
      }
      i++
    }
    // Stop before an unescaped newline so the main loop counts it.
    if (source[i] === quote) i++
  }
  const skipTemplate = () => {
    i++
    while (i < source.length) {
      const char = source[i]
      if (char === '\\') {
        if (source[i + 1] === '\n') line++
        i += 2
        continue
      }
      if (char === '\n') line++
      if (char === '`') {
        i++
        return
      }
      if (char === '$' && source[i + 1] === '{') {
        templateBraces.push(0)
        i += 2
        return
      }
      i++
    }
  }
  while (i < source.length) {
    const char = source[i]
    const next = source[i + 1]
    if (char === '\n') {
      line++
      i++
    } else if (char === '/' && next === '/') {
      const end = source.indexOf('\n', i)
      const stop = end === -1 ? source.length : end
      found.push({
        value: source.slice(i + 2, stop),
        start: i,
        end: stop,
        line,
      })
      i = stop
    } else if (char === '/' && next === '*') {
      const close = source.indexOf('*/', i + 2)
      const stop = close === -1 ? source.length : close + 2
      const value = source.slice(i + 2, close === -1 ? stop : close)
      found.push({ value, start: i, end: stop, line })
      line += value.split('\n').length - 1
      i = stop
    } else if (
      (char === '"' || char === "'") &&
      // A quote right after a letter or digit is text (`Don't`), not a
      // string: JS never starts a string literal there.
      !/[\w$]/.test(source[i - 1] ?? '')
    ) {
      skipString(char)
    } else if (char === '`') {
      skipTemplate()
    } else if (templateBraces.length > 0 && (char === '{' || char === '}')) {
      const depth = templateBraces.length - 1
      if (char === '{') {
        templateBraces[depth] = (templateBraces[depth] ?? 0) + 1
        i++
      } else if (templateBraces[depth] === 0) {
        // The `}` that closes `${`: back inside the template literal.
        templateBraces.pop()
        i--
        skipTemplate()
      } else {
        templateBraces[depth] = (templateBraces[depth] ?? 1) - 1
        i++
      }
    } else {
      i++
    }
  }
  return found
}

/** Removes commas that directly precede `}` or `]`, outside JSON strings. */
function dropTrailingCommas(json: string): string {
  let out = ''
  let inString = false
  for (let i = 0; i < json.length; i++) {
    const char = json[i]
    if (inString) {
      out += char
      if (char === '\\') out += json[++i] ?? ''
      else if (char === '"') inString = false
    } else if (char === '"') {
      inString = true
      out += char
    } else if (char === ',' && /^\s*[}\]]/.test(json.slice(i + 1))) {
      // A trailing comma: drop it.
    } else {
      out += char
    }
  }
  return out
}

/** Parses JSONC: JSON with comments and trailing commas. */
export function parseJsonc(source: string): unknown {
  let text = ''
  let from = 0
  for (const comment of comments(source)) {
    text += source.slice(from, comment.start)
    from = comment.end
  }
  text += source.slice(from)
  return JSON.parse(dropTrailingCommas(text))
}

/** The repo's `.oxlintrc.json`, parsed. */
export function readOxlintConfig(): Record<string, unknown> {
  return parseJsonc(
    readFileSync(join(repoRoot, '.oxlintrc.json'), 'utf8'),
  ) as Record<string, unknown>
}
