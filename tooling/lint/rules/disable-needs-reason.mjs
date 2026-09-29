/**
 * `bazza/disable-needs-reason`: every lint exception names its rule, says why,
 * and a `bazza/*` exception covers one line only.
 *
 * Directives are read the way oxlint 1.86 reads them, so this rule and oxlint
 * agree on what a comment disables:
 * - the comment text must start with `oxlint-` or `eslint-` after whitespace
 *   (a JSDoc `/**` block is not a directive);
 * - the rule list ends at the first `--`, and everything after it is the reason;
 * - a rule name matches with or without its plugin prefix.
 *
 * A directive can disable this rule too, so reports go on a line no such
 * directive covers. When no line is free (a bare `oxlint-disable` on line 1
 * with no `oxlint-enable` after it), oxlint hides the report. The CI exceptions
 * report re-checks directives as text with `parseDirective` and
 * `directiveProblem` to catch that case.
 */
import { bazzaRuleNames } from './rule-names.mjs'

const directive = /^(eslint|oxlint)-(disable|enable)(-next-line|-line)?(?=\s|$)/

/** The rule's name without its plugin prefix: `bazza/use-client` → `use-client`. */
const bareName = (rule) => rule.slice(rule.lastIndexOf('/') + 1)

/**
 * Parses a comment's text as a directive, or returns null when oxlint would
 * not treat it as one.
 */
export function parseDirective(commentValue) {
  const body = commentValue.trimStart()
  const match = directive.exec(body)
  if (!match) return null
  const [head, tool, action, scope = ''] = match
  const rest = body.slice(head.length)
  const separator = rest.indexOf('--')
  const rulesText = separator === -1 ? rest : rest.slice(0, separator)
  const reason = separator === -1 ? '' : rest.slice(separator + 2).trim()
  const rules = rulesText.split(/[\s,]+/).filter(Boolean)
  return { tool, action, scope, rules, reason }
}

/** Whether a parsed directive turns off this rule, by name or by naming none. */
function silencesThisRule(parsed) {
  return (
    parsed?.action === 'disable' &&
    parsed.tool === 'oxlint' &&
    (parsed.rules.length === 0 ||
      parsed.rules.some((rule) => bareName(rule) === 'disable-needs-reason'))
  )
}

/** Why a parsed directive isn't acceptable, or null when it is. */
export function directiveProblem(parsed) {
  if (parsed?.action !== 'disable') return null
  if (parsed.tool === 'eslint') {
    return 'this repo has no ESLint, so `eslint-disable` does nothing. Delete it, or use `oxlint-disable-next-line <rule> -- <reason>`.'
  }
  if (parsed.rules.length === 0) {
    return 'a lint exception must name the rule it disables: `// oxlint-disable-next-line <rule> -- <reason>`.'
  }
  if (parsed.rules.some((rule) => bareName(rule) === 'disable-needs-reason')) {
    return '`bazza/disable-needs-reason` cannot be disabled.'
  }
  if (!parsed.reason) {
    return 'a lint exception needs a reason after `--`: `// oxlint-disable-next-line <rule> -- <reason>`.'
  }
  if (
    parsed.scope === '' &&
    parsed.rules.some(
      (rule) => rule.startsWith('bazza/') || bazzaRuleNames.has(bareName(rule)),
    )
  ) {
    return '`bazza/*` rules can only be disabled for one line: use `oxlint-disable-next-line`.'
  }
  return null
}

/** Whether a parsed directive turns this rule back on after a bare `disable`. */
function reenablesThisRule(parsed) {
  return (
    parsed.action === 'enable' &&
    parsed.tool === 'oxlint' &&
    parsed.scope === '' &&
    (parsed.rules.length === 0 ||
      parsed.rules.some((rule) => bareName(rule) === 'disable-needs-reason'))
  )
}

/**
 * Lines on which a report from this rule could be silenced: every line a
 * directive that turns this rule off covers, counted whole even where oxlint
 * covers only part of a line. `-line` covers its own lines; `-next-line`
 * covers the rest of its own line and the line after; a bare `disable` covers
 * everything up to the next `enable` for this rule, or the end of the file.
 */
function silencedLines(directives, lineCount) {
  const lines = new Set()
  directives.forEach(({ parsed, loc }, index) => {
    if (!silencesThisRule(parsed)) return
    let first = loc.start.line
    let last = loc.end.line
    if (parsed.scope === '-next-line') {
      first = loc.end.line
      last = loc.end.line + 1
    } else if (parsed.scope === '') {
      const enable = directives
        .slice(index + 1)
        .find((next) => reenablesThisRule(next.parsed))
      last = enable ? enable.loc.end.line : lineCount
    }
    for (let line = first; line <= last; line++) lines.add(line)
  })
  return lines
}

/** The line nearest `line` that no directive silences, or null if every line is. */
function nearestFreeLine(line, silenced, lineCount) {
  for (let distance = 0; distance < lineCount; distance++) {
    for (const candidate of [line + distance, line - distance]) {
      if (
        candidate >= 1 &&
        candidate <= lineCount &&
        !silenced.has(candidate)
      ) {
        return candidate
      }
    }
  }
  return null
}

export const disableNeedsReason = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Every lint exception names its rule, says why, and bazza rules are disabled one line at a time.',
    },
  },
  create(context) {
    return {
      Program() {
        const lineCount = context.sourceCode.text.split('\n').length
        const directives = context.sourceCode
          .getAllComments()
          .map((comment) => ({
            parsed: parseDirective(comment.value),
            loc: comment.loc,
          }))
          .filter(({ parsed }) => parsed)
        const silenced = silencedLines(directives, lineCount)
        for (const { parsed, loc } of directives) {
          const problem = directiveProblem(parsed)
          if (!problem) continue
          const line = nearestFreeLine(loc.start.line, silenced, lineCount)
          context.report({
            loc:
              line === null || line === loc.start.line
                ? loc
                : { start: { line, column: 0 }, end: { line, column: 0 } },
            message: `Unacceptable lint exception on line ${loc.start.line}: ${problem} See "Lint" in packages/react/AGENTS.md.`,
          })
        }
      },
    }
  },
}
