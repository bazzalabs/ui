import { describe, expect, it } from 'vitest'
import plugin, {
  bazzaRuleNames,
  directiveProblem,
  parseDirective,
} from './bazza-plugin.mjs'
import { type Finding, lintWith, lintWithRepoConfig } from './harness.ts'

const lines = (findings: readonly Finding[]) => findings.map((f) => f.line)
const rules = (findings: readonly Finding[]) => findings.map((f) => f.rule)

describe('bazza/disable-needs-reason', () => {
  it('accepts a one-line exception that names its rule and gives a reason', async () => {
    const findings = await lintWith('bazza/disable-needs-reason', {
      'a.ts': `// oxlint-disable-next-line no-console -- the CLI prints to stdout
console.log('x')
// oxlint-disable-next-line bazza/use-client -- server-only module
export const a = 1
/* oxlint-disable no-console -- whole-file exceptions are fine for built-ins */
`,
    })
    expect(findings).toEqual([])
  })

  it('reports eslint directives, missing rules, missing reasons and file-wide bazza exceptions', async () => {
    const findings = await lintWith('bazza/disable-needs-reason', {
      'a.ts': `export const a = 1 // eslint-disable-line react-hooks/exhaustive-deps
// oxlint-disable-next-line
export const b = 2
// oxlint-disable-next-line no-console
console.log('x')
/* oxlint-disable bazza/use-client -- this whole file is server-only */
// oxlint-disable-next-line bazza/disable-needs-reason -- trust me
`,
    })
    // The bare directive on line 2 and the one on line 7 disable this rule on
    // their own line and the next, so their reports move up a line.
    expect(lines(findings)).toEqual([1, 1, 4, 6, 6])
    const problemOnLine = (line: number) =>
      findings.find((f) => f.message.includes(`on line ${line}:`))?.message
    expect(problemOnLine(1)).toContain('this repo has no ESLint')
    expect(problemOnLine(2)).toContain('must name the rule')
    expect(problemOnLine(4)).toContain('needs a reason')
    expect(problemOnLine(6)).toContain('one line')
    expect(problemOnLine(7)).toContain('cannot be disabled')
  })

  it('reads directives spread over several lines of a block comment', async () => {
    const findings = await lintWith('bazza/disable-needs-reason', {
      'a.ts': `export const a = 1
/* oxlint-disable bazza/use-client,
   bazza/part-namespace */
/* oxlint-disable-next-line no-console
   -- the reason can sit on its own line */
console.log(a)
`,
    })
    expect(lines(findings)).toEqual([2])
    expect(findings[0]?.message).toContain(
      'on line 2: a lint exception needs a reason',
    )
  })

  it('reads directives the way oxlint does', async () => {
    const findings = await lintWith('bazza/disable-needs-reason', {
      'a.ts': `export const a = 1
console.log(a) // oxlint-disable-line no-console--
console.log(a) // oxlint-disable-line no-console--stdout is the point
/* oxlint-disable disable-needs-reason -- a bare name still names bazza/disable-needs-reason */
/**
 * oxlint-disable-next-line
 * A JSDoc block is not a directive, so it disables nothing.
 */
export const b = 2
`,
    })
    // Line 3 is accepted: its reason is glued to `--`, which oxlint allows.
    // Line 4's directive disables this rule for the rest of the file, so its
    // report moves up to line 3.
    expect(lines(findings)).toEqual([2, 3])
    const messages = findings.map((f) => f.message)
    expect(messages).toContainEqual(
      expect.stringContaining('on line 2: a lint exception needs a reason'),
    )
    expect(messages).toContainEqual(
      expect.stringContaining(
        'on line 4: `bazza/disable-needs-reason` cannot be disabled',
      ),
    )
  })

  it('puts a report where no directive can silence it', async () => {
    const findings = await lintWith('bazza/disable-needs-reason', {
      'a.ts': `export const a = 1
export const b = 2 // oxlint-disable-line
/* oxlint-disable-next-line */ export const c = 3 // oxlint-disable-line foo/disable-needs-reason -- quiet
export const d = 4
export const e = 5
/* oxlint-disable -- everything below */
export const f = 6
`,
    })
    // Lines 2 and 3 are silenced by their own \`-line\` directives, line 4 by
    // the \`-next-line\` on line 3, and lines 6 onward by the bare \`disable\`.
    expect(
      findings.map((f) => [f.line, f.message.match(/on line \d+/)?.[0]]),
    ).toEqual([
      [1, 'on line 2'],
      [5, 'on line 3'],
      [5, 'on line 3'],
      [5, 'on line 6'],
    ])
  })

  it('stops counting a bare disable at the next enable', async () => {
    const findings = await lintWith('bazza/disable-needs-reason', {
      'a.ts': `/* oxlint-disable -- generated block */
export const a = 1
/* oxlint-enable */
export const b = 2
`,
    })
    expect(lines(findings)).toEqual([4])
  })

  it('cannot report a bare disable on line 1 that nothing re-enables', async () => {
    // Known gap: oxlint silences every position in the file. The CI exceptions
    // report catches this case by reading directives as text.
    const findings = await lintWith('bazza/disable-needs-reason', {
      'a.ts': `/* oxlint-disable */
export const a = 1
`,
    })
    expect(findings).toEqual([])
  })

  it('ignores enable directives and comments that only mention a directive', async () => {
    const findings = await lintWith('bazza/disable-needs-reason', {
      'a.ts': `/* oxlint-enable no-console */
// Write exceptions as oxlint-disable-next-line <rule> -- <reason>.
export const a = 1
`,
    })
    expect(findings).toEqual([])
  })
})

describe('the plugin', () => {
  it('registers exactly the rules listed in bazzaRuleNames', () => {
    expect(Object.keys(plugin.rules).sort()).toEqual([...bazzaRuleNames].sort())
  })
})

describe('parseDirective / directiveProblem', () => {
  it('splits rules from the reason at the first `--`', () => {
    expect(
      parseDirective(
        ' oxlint-disable-next-line a/b, c -- keeps --flag-like text',
      ),
    ).toEqual({
      tool: 'oxlint',
      action: 'disable',
      scope: '-next-line',
      rules: ['a/b', 'c'],
      reason: 'keeps --flag-like text',
    })
  })

  it('ends the rule list at the first `--`, as oxlint does', () => {
    expect(parseDirective(' oxlint-disable-line a/b--why')).toMatchObject({
      rules: ['a/b'],
      reason: 'why',
    })
  })

  it('does not treat a JSDoc block as a directive', () => {
    expect(
      parseDirective('*\n * oxlint-disable-line no-console -- why'),
    ).toBeNull()
  })

  it('returns null for comments that are not directives', () => {
    expect(parseDirective(' just a comment')).toBeNull()
    expect(directiveProblem(null)).toBeNull()
  })
})

describe('repo config', () => {
  it('reports the rules of hooks in packages/react, including tests', async () => {
    const hook = `import * as React from 'react'
export function Part({ open }: { open: boolean }) {
  if (open) React.useState(0)
  return null
}
`
    const findings = await lintWithRepoConfig({
      'packages/react/src/part.tsx': hook,
      'packages/react/src/part.test.tsx': hook,
    })
    expect(rules(findings)).toEqual([
      'react-hooks(rules-of-hooks)',
      'react-hooks(rules-of-hooks)',
    ])
  })

  it('accepts hooks in forwardRef render functions named `*Impl`', async () => {
    const findings = await lintWithRepoConfig({
      'packages/react/src/item.tsx': `import * as React from 'react'
function SelectItemImpl<Value>(props: { value: Value }, ref: React.Ref<HTMLDivElement>) {
  const [state] = React.useState(props.value)
  return <div ref={ref}>{String(state)}</div>
}
export const SelectItem = React.forwardRef(SelectItemImpl)
`,
    })
    expect(findings).toEqual([])
  })

  it("blocks Base UI's private internals and the old package name", async () => {
    const findings = await lintWithRepoConfig({
      'packages/react/src/a.ts': `import { useDirection } from '@base-ui/react/internals/direction-context'
import { Popover } from '@base-ui-components/react/popover'
import { useRender } from '@base-ui/react/use-render'
export const parts = [useDirection, Popover, useRender]
`,
    })
    expect(lines(findings)).toEqual([1, 2])
    expect(rules(findings)).toEqual([
      'eslint(no-restricted-imports)',
      'eslint(no-restricted-imports)',
    ])
  })

  it('does not lint anything outside packages/react', async () => {
    const findings = await lintWithRepoConfig({
      'apps/web/a.tsx': `import * as React from 'react'
import { useDirection } from '@base-ui/react/internals/direction-context'
export function A({ open }: { open: boolean }) {
  if (open) React.useState(0)
  return useDirection // eslint-disable-line no-console
}
`,
    })
    expect(findings).toEqual([])
  })

  it('honours a reasoned oxlint exception', async () => {
    const findings = await lintWithRepoConfig({
      'packages/react/src/part.tsx': `import * as React from 'react'
export function Part({ open }: { open: boolean }) {
  // oxlint-disable-next-line react-hooks/rules-of-hooks -- fixture for the exception syntax
  if (open) React.useState(0)
  return null
}
`,
    })
    expect(findings).toEqual([])
  })

  it('does not honour eslint-disable comments', async () => {
    const findings = await lintWithRepoConfig({
      'packages/react/src/part.tsx': `import * as React from 'react'
export function Part({ open }: { open: boolean }) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (open) React.useState(0)
  return null
}
`,
    })
    expect(rules(findings)).toEqual([
      'bazza(disable-needs-reason)',
      'react-hooks(rules-of-hooks)',
    ])
  })

  it('exempts allowlisted files from their rule only', async () => {
    const findings = await lintWithRepoConfig({
      'packages/react/src/select/positioner/positioner.tsx': `import { useDirection } from '@base-ui/react/internals/direction-context'
export const a = useDirection // eslint-disable-line no-console
`,
    })
    expect(rules(findings)).toEqual(['bazza(disable-needs-reason)'])
  })

  it.each([
    [
      'packages/react/src/internal/listbox/store/ListboxStore.ts',
      `import { useRefWithInit } from '@base-ui/utils/useRefWithInit'
export class Store {
  static use() {
    if (Math.random()) return useRefWithInit(() => 1)
  }
}
`,
    ],
    [
      'packages/react/src/internal/popup-menu/data-first/data-list.tsx',
      `export const a = 1 // eslint-disable-line react-hooks/exhaustive-deps
`,
    ],
  ])('exempts %s from its allowlisted rule', async (path, source) => {
    expect(await lintWithRepoConfig({ [path]: source })).toEqual([])
    const elsewhere = path.replace(/[^/]+$/, 'other.tsx')
    expect(await lintWithRepoConfig({ [elsewhere]: source })).not.toEqual([])
  })
})
