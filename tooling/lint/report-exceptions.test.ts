import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  brokenExceptions,
  findConfigExceptions,
  findInlineExceptions,
  formatReport,
  type InlineException,
} from './report-exceptions.ts'
import {
  comments,
  parseJsonc,
  readOxlintConfig,
  repoRoot,
} from './source-text.ts'

describe('comments', () => {
  it("doesn't let an apostrophe in JSX text swallow later comments", () => {
    const source = `export const A = () => <p>Don't</p> /* on line 1 */
import a from 'a'
const url = 'https://x' // on line 3
const s = 'escaped \\
newline' // on line 5
`
    expect(comments(source).map((c) => [c.line, c.value.trim()])).toEqual([
      [1, 'on line 1'],
      [3, 'on line 3'],
      [5, 'on line 5'],
    ])
  })

  it('ends an unclosed quote at the end of its line', () => {
    const source = `const r = /"/
// on line 2
export const A = () => <p><b>Bob</b>'s</p>
// on line 4
`
    expect(comments(source).map((c) => [c.line, c.value.trim()])).toEqual([
      [2, 'on line 2'],
      [4, 'on line 4'],
    ])
  })

  it('skips comment markers inside strings and template literals', () => {
    const source = `const url = 'https://example.com' // real one
const glob = "**/*.test.tsx"
const t = \`/* not a comment \${a /* inside code */ + '//'} still text // no\`
/* block
   spans lines */ const b = 1 // after
`
    expect(comments(source).map((c) => [c.line, c.value.trim()])).toEqual([
      [1, 'real one'],
      [3, 'inside code'],
      [4, 'block\n   spans lines'],
      [5, 'after'],
    ])
  })
})

describe('parseJsonc', () => {
  it('drops comments and trailing commas but keeps strings intact', () => {
    expect(
      parseJsonc(`{
  // line comment
  "url": "https://example.com", /* block */
  "glob": "src/*.{ts,}",
  "list": [1, 2,],
}`),
    ).toEqual({
      url: 'https://example.com',
      glob: 'src/*.{ts,}',
      list: [1, 2],
    })
  })
})

describe('findInlineExceptions', () => {
  it('finds every disable directive, but not directive text in strings', () => {
    const source = `// oxlint-disable-next-line bazza/use-client -- server-only helper
export const a = 1
const b = 2 // eslint-disable-line react-hooks/exhaustive-deps
/* oxlint-disable */
{/* oxlint-disable-next-line no-console -- JSX comment */}
const fixture = '// oxlint-disable-line'
const glob = 'src/**/*.ts' // oxlint-disable-line no-console -- after a glob
`
    const found = findInlineExceptions(['a.tsx'], () => source)
    expect(found.map((e) => [e.line, e.tool, e.rules, e.reason])).toEqual([
      [1, 'oxlint', ['bazza/use-client'], 'server-only helper'],
      [3, 'eslint', ['react-hooks/exhaustive-deps'], ''],
      [4, 'oxlint', [], ''],
      [5, 'oxlint', ['no-console'], 'JSX comment'],
      [7, 'oxlint', ['no-console'], 'after a glob'],
    ])
    expect(found.map((e) => e.problem !== null)).toEqual([
      false,
      true,
      true,
      false,
      false,
    ])
  })
})

describe('findConfigExceptions', () => {
  it('separates allowlists (literal paths) from rules turned off by pattern', () => {
    const { allowlists, patterns } = findConfigExceptions({
      overrides: [
        {
          files: ['packages/react/**/*.ts'],
          rules: { 'bazza/use-client': 'error' },
        },
        {
          files: ['packages/react/src/**/*.test.tsx'],
          rules: { 'bazza/use-client': 'off' },
        },
        {
          files: ['packages/react/src/b.ts', 'packages/react/src/a.ts'],
          rules: { 'bazza/use-client': 'off' },
        },
        {
          files: ['packages/react/src/c.ts'],
          rules: { 'bazza/part-namespace': 'allow', 'bazza/use-client': 0 },
        },
        {
          files: ['packages/react/src/d.ts'],
          rules: { 'bazza/use-client': 'error' },
        },
        {
          files: ['packages/react/src/e.ts'],
          rules: { 'bazza/use-client': ['off', {}] },
        },
      ],
    })
    expect(allowlists).toEqual([
      { rule: 'bazza/part-namespace', files: ['packages/react/src/c.ts'] },
      {
        rule: 'bazza/use-client',
        files: [
          'packages/react/src/a.ts',
          'packages/react/src/b.ts',
          'packages/react/src/c.ts',
          'packages/react/src/e.ts',
        ],
      },
    ])
    expect(patterns).toEqual([
      {
        files: ['packages/react/src/**/*.test.tsx'],
        rules: ['bazza/use-client'],
      },
    ])
  })

  it("reads the repo's own config: allowlisted files exist, tests are scoped off", () => {
    const { allowlists, patterns } = findConfigExceptions(readOxlintConfig())
    expect(allowlists.length).toBeGreaterThan(0)
    for (const { files } of allowlists) {
      for (const file of files) {
        expect(existsSync(join(repoRoot, file)), file).toBe(true)
      }
    }
    expect(patterns).toContainEqual({
      files: ['packages/react/src/**/*.test.{ts,tsx}'],
      rules: expect.arrayContaining([
        'bazza/use-client',
        'bazza/part-namespace',
      ]),
    })
  })
})

describe('brokenExceptions and formatReport', () => {
  const exception = (overrides: Partial<InlineException>): InlineException => ({
    file: 'a.ts',
    line: 1,
    tool: 'oxlint',
    rules: ['no-console'],
    reason: 'CLI output',
    problem: null,
    ...overrides,
  })

  it('fails on malformed exceptions, except eslint comments in a file already allowlisted for them', () => {
    const allowlists = [{ rule: 'bazza/disable-needs-reason', files: ['a.ts'] }]
    const staleEslint = exception({
      tool: 'eslint',
      reason: '',
      problem: 'no ESLint',
    })
    const bareInAllowlisted = exception({
      line: 2,
      rules: [],
      reason: '',
      problem: 'must name the rule',
    })
    const bareElsewhere = exception({
      file: 'b.ts',
      rules: [],
      reason: '',
      problem: 'must name the rule',
    })
    const broken = brokenExceptions(allowlists, [
      staleEslint,
      bareInAllowlisted,
      bareElsewhere,
    ])
    expect([...broken]).toEqual([bareInAllowlisted, bareElsewhere])
  })

  it('counts entries and distinct files, and marks missing files and problems', () => {
    const bad = exception({
      line: 4,
      rules: [],
      reason: '',
      problem: 'must name the rule',
    })
    const lines = formatReport(
      {
        allowlists: [
          { rule: 'bazza/part-namespace', files: ['here.ts'] },
          { rule: 'bazza/use-client', files: ['gone.ts', 'here.ts'] },
        ],
        patterns: [{ files: ['**/*.test.ts'], rules: ['bazza/use-client'] }],
      },
      [exception({}), bad],
      new Set([bad]),
      (file) => file === 'here.ts',
    )
    expect(lines[0]).toBe(
      'Lint exceptions in packages/react: 3 allowlist entries across 2 file(s), 2 inline.',
    )
    expect(lines).toContain('    gone.ts  (file no longer exists)')
    expect(lines).toContain('  **/*.test.ts: bazza/use-client')
    expect(lines).toContain('  a.ts:1  no-console  -- CLI output')
    expect(lines).toContain(
      '  a.ts:4  (all rules)  -- (no reason)  ✗ must name the rule',
    )
    expect(lines.at(-1)).toContain("1 lint exception(s) aren't acceptable")
  })
})
