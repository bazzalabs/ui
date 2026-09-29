import { describe, expect, it } from 'vitest'
import plugin, {
  bazzaRuleNames,
  directiveProblem,
  parseDirective,
} from './bazza-plugin.mjs'
import {
  type Finding,
  fixWith,
  lintWith,
  lintWithRepoConfig,
} from './harness.ts'

const lines = (findings: readonly Finding[]) => findings.map((f) => f.line)
const rules = (findings: readonly Finding[]) => findings.map((f) => f.rule)

/** Every `bazza/*` rule except `disable-needs-reason`, as oxlint reports them. */
const partRules = new Set(
  [...bazzaRuleNames]
    .filter((name) => name !== 'disable-needs-reason')
    .map((name) => `bazza(${name})`),
)
/** Lints with the repo config, dropping findings from the part-shape rules. */
const lintIgnoringPartRules = async (
  files: Parameters<typeof lintWithRepoConfig>[0],
) => (await lintWithRepoConfig(files)).filter((f) => !partRules.has(f.rule))

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

describe('bazza/use-client', () => {
  it("accepts a module whose prologue has 'use client'", async () => {
    const findings = await lintWith('bazza/use-client', {
      'a.tsx': `// Copyright header
'use strict'
'use client'
export const a = 1
`,
    })
    expect(findings).toEqual([])
  })

  it('reports a module without it, including one that mentions it later', async () => {
    const findings = await lintWith('bazza/use-client', {
      'a.tsx': `import * as React from 'react'
'use client'
export const A = () => React.useId()
`,
    })
    expect(lines(findings)).toEqual([1])
  })

  it('can be disabled for a file with a comment above its first statement', async () => {
    const findings = await lintWith('bazza/use-client', {
      'a.ts': `// oxlint-disable-next-line bazza/use-client -- server-only helper
export const a = 1
`,
    })
    expect(findings).toEqual([])
  })

  it('adds the directive with --fix', async () => {
    expect(
      await fixWith('bazza/use-client', 'a.ts', "import { x } from './x'\n"),
    ).toBe("'use client'\n\nimport { x } from './x'\n")
  })
})

describe('bazza/forward-ref-named', () => {
  it('accepts named function expressions and named functions passed by name', async () => {
    const findings = await lintWith('bazza/forward-ref-named', {
      'a.tsx': `import * as React from 'react'
import { forwardRef } from 'react'
function SelectItemImpl<V>(props: { value: V }, ref: React.Ref<HTMLDivElement>) {
  return <div ref={ref} />
}
export const A = React.forwardRef(function A(props, forwardedRef) {
  return <div ref={forwardedRef} {...props} />
})
export const B = forwardRef(SelectItemImpl) as <V>(props: { value: V }) => React.ReactElement
`,
    })
    expect(findings).toEqual([])
  })

  it('follows a name to its declaration in the module', async () => {
    const findings = await lintWith('bazza/forward-ref-named', {
      'a.tsx': `import * as React from 'react'
import { forwardRef as fr } from 'react'
import { renderItem } from './render'
const ArrowImpl = (props: object, ref: React.Ref<HTMLDivElement>) => <div ref={ref} />
const NamedImpl = function NamedImpl(props: object, ref: React.Ref<HTMLDivElement>) {
  return <div ref={ref} />
}
export const A = React.forwardRef(ArrowImpl)
export const B = React.forwardRef(NamedImpl)
export const C = React.forwardRef(renderItem)
export const D = fr((props, ref) => <div ref={ref} />)
`,
    })
    expect(findings.map((f) => [f.line, f.message.split('.')[0]])).toEqual([
      [
        8,
        '`forwardRef` wraps `ArrowImpl`, which is an arrow or anonymous function',
      ],
      [
        10,
        "Can't tell whether `renderItem` is a named function: declare it in this module with `function renderItem(…)`",
      ],
      [11, '`forwardRef` wraps an anonymous function'],
    ])
  })

  it('reports arrows, anonymous functions and shapes it cannot follow', async () => {
    const findings = await lintWith('bazza/forward-ref-named', {
      'a.tsx': `import * as React from 'react'
export const A = React.forwardRef((props, ref) => <div ref={ref} />)
export const B = React.forwardRef(function (props, ref) {
  return <div ref={ref} />
})
export const C = React.forwardRef(makeRender())
`,
    })
    expect(lines(findings)).toEqual([2, 3, 6])
    expect(findings[0]?.message).toContain('anonymous function')
    expect(findings[2]?.message).toContain("Can't tell")
  })
})

describe('bazza/part-namespace', () => {
  const part = (
    namespace: string,
    extra = '',
  ) => `import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
export interface PartState extends Record<string, unknown> {}
export interface PartProps {}
export const Part = React.forwardRef<HTMLDivElement, Part.Props>(function Part(props, forwardedRef) {
  const state: PartState = {}
  return useRender({ ref: forwardedRef, state, props, defaultTagName: 'div' })
})
${namespace}
${extra}`

  it('accepts a part with State and Props on its namespace', async () => {
    const findings = await lintWith('bazza/part-namespace', {
      'a.tsx': part(`export namespace Part {
  export type State = PartState
  export interface Props extends PartProps {}
}`),
    })
    expect(findings).toEqual([])
  })

  it('reports a missing namespace, a missing Props, and a missing State', async () => {
    const findings = await lintWith('bazza/part-namespace', {
      'none.tsx': part(''),
      'no-props.tsx': part(
        'export namespace Part { export type State = PartState }',
      ),
      'no-state.tsx': part(
        'export namespace Part { export interface Props extends PartProps {} }',
      ),
    })
    expect(
      findings.map((f) => [f.file, f.message.match(/has no (.+?) type/)?.[1]]),
    ).toEqual([
      ['no-props.tsx', '`Part.Props`'],
      ['no-state.tsx', '`Part.State`'],
      ['none.tsx', '`Part.State` or `Part.Props`'],
    ])
  })

  it('needs no State when the part passes none to useRender', async () => {
    const findings = await lintWith('bazza/part-namespace', {
      'a.tsx': `import * as React from 'react'
export const Part = React.forwardRef(function Part(props, ref) {
  return <div ref={ref} />
})
export namespace Part { export type Props = React.ComponentProps<'div'> }
`,
    })
    expect(findings).toEqual([])
  })

  it('requires State only for the part whose own render passes state', async () => {
    const findings = await lintWith('bazza/part-namespace', {
      'a.tsx': `import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
function WithStateImpl(props: object, ref: React.Ref<HTMLDivElement>) {
  return useRender({ ref, state: {}, props, defaultTagName: 'div' })
}
export const WithState = React.forwardRef(WithStateImpl)
export namespace WithState { export interface Props {} }
export const Plain = React.forwardRef(function Plain(props, ref) {
  return <div ref={ref} />
})
export namespace Plain { export interface Props {} }
`,
    })
    expect(
      findings.map((f) => [f.line, f.message.match(/has no (.+?) type/)?.[1]]),
    ).toEqual([[6, '`WithState.State`']])
  })

  it('finds parts wrapped in memo or built with an aliased forwardRef', async () => {
    const findings = await lintWith('bazza/part-namespace', {
      'a.tsx': `import * as React from 'react'
import { forwardRef as fr } from 'react'
export const Memo = React.memo(React.forwardRef(function Memo(props, ref) {
  return <div ref={ref} />
}))
export const Aliased = fr(function Aliased(props, ref) {
  return <div ref={ref} />
})
`,
    })
    expect(findings.map((f) => f.line)).toEqual([3, 6])
  })

  it('counts only exported namespace members', async () => {
    const findings = await lintWith('bazza/part-namespace', {
      'a.tsx': part(
        'export namespace Part { type State = PartState; interface Props extends PartProps {} }',
      ),
    })
    expect(findings[0]?.message).toContain('`Part.State` or `Part.Props`')
  })

  it('recognises useRender by alias and ignores components nested in the render', async () => {
    const findings = await lintWith('bazza/part-namespace', {
      'a.tsx': `import * as React from 'react'
import { useRender as useBaseRender } from '@base-ui/react/use-render'
export const Aliased = React.forwardRef(function Aliased(props, ref) {
  return useBaseRender({ ref, state: {}, props, defaultTagName: 'div' })
})
export namespace Aliased { export interface Props {} }
export const Outer = React.forwardRef(function Outer(props, ref) {
  function Inner() {
    return useBaseRender({ state: {}, props: {}, defaultTagName: 'span' })
  }
  return <div ref={ref}><Inner /></div>
})
export namespace Outer { export interface Props {} }
`,
    })
    expect(findings.map((f) => f.line)).toEqual([3])
  })

  it("asks for State when it can't find or read the render function", async () => {
    const findings = await lintWith('bazza/part-namespace', {
      'a.tsx': `import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import { renderItem } from './render'
const CastImpl = function CastImpl(props: object, ref: React.Ref<HTMLDivElement>) {
  return useRender({ ref, state: {}, props, defaultTagName: 'div' })
} as (props: object, ref: React.Ref<HTMLDivElement>) => React.ReactElement
export const Cast = React.forwardRef(CastImpl)
export namespace Cast { export interface Props {} }
export const Imported = React.forwardRef(renderItem)
export namespace Imported { export interface Props {} }
export declare namespace Declared { interface Props {} }
export const Declared = React.forwardRef(function Declared(props, ref) {
  return <div ref={ref} />
})
`,
    })
    expect(findings.map((f) => [f.line, f.message.slice(0, 40)])).toEqual([
      [7, 'Part `Cast` has no `Cast.State` type. Co'],
      [9, "Can't tell whether part `Imported` passe"],
    ])
  })

  it('merges namespace blocks declared more than once', async () => {
    const findings = await lintWith('bazza/part-namespace', {
      'a.tsx': part(`export namespace Part { export type State = PartState }
export namespace Part { export interface Props extends PartProps {} }`),
    })
    expect(findings).toEqual([])
  })

  it("reports a part whose useRender options it can't read", async () => {
    const findings = await lintWith('bazza/part-namespace', {
      'a.tsx': `import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
export const Part = React.forwardRef(function Part(props, ref) {
  const options = { ref, props, defaultTagName: 'div' as const }
  return useRender(options)
})
export namespace Part { export interface Props {} }
`,
    })
    expect(findings.map((f) => f.line)).toEqual([3])
    expect(findings[0]?.message).toContain(
      "Can't tell whether part `Part` passes `state`",
    )
  })

  it('checks parts exported by name and generic parts behind a cast, not internal ones', async () => {
    const findings = await lintWith('bazza/part-namespace', {
      'a.tsx': `import * as React from 'react'
function ItemImpl(props: object, ref: React.Ref<HTMLDivElement>) {
  return <div ref={ref} />
}
const Item = React.forwardRef(ItemImpl) as (props: object) => React.ReactElement
const Inner = React.forwardRef(function Inner(props, ref) {
  return <div ref={ref} />
})
export { Item }
`,
    })
    expect(findings.map((f) => f.line)).toEqual([5])
  })
})

describe('bazza/data-attrs-enum', () => {
  it('accepts named enums and enums re-exported by name', async () => {
    const findings = await lintWith('bazza/data-attrs-enum', {
      'item.data-attrs.ts': `export { PopupMenuItemDataAttributes } from './popup.data-attrs.js'
export enum ItemDataAttributes {
  highlighted = 'data-highlighted',
}
`,
      'positioner.css-vars.ts': `export enum PositionerCssVars {
  availableWidth = '--available-width',
}
`,
    })
    expect(findings).toEqual([])
  })

  it('reports as-const objects, badly named enums and wildcard re-exports', async () => {
    const findings = await lintWith('bazza/data-attrs-enum', {
      'item.data-attrs.ts': `export const ItemDataAttributes = {
  highlighted: 'data-highlighted',
} as const
export enum ItemAttrs { a = 'data-a' }
export * from './other.js'
`,
      'positioner.css-vars.ts': `export enum PositionerVars { a = '--a' }
`,
    })
    expect(findings.map((f) => [f.file, f.line])).toEqual([
      ['item.data-attrs.ts', 1],
      ['item.data-attrs.ts', 4],
      ['item.data-attrs.ts', 5],
      ['positioner.css-vars.ts', 1],
    ])
    expect(findings[0]?.message).toContain('as const')
  })

  it('checks what a local export list points at', async () => {
    const findings = await lintWith('bazza/data-attrs-enum', {
      'item.data-attrs.ts': `const ItemDataAttributes = { a: 'data-a' } as const
enum ItemStateDataAttributes { b = 'data-b' }
export { ItemDataAttributes, ItemStateDataAttributes }
`,
    })
    expect(findings.map((f) => f.line)).toEqual([3])
    expect(findings[0]?.message).toContain('as const')
  })

  it('accepts enums re-exported from data-attribute files only', async () => {
    const findings = await lintWith('bazza/data-attrs-enum', {
      'item.data-attrs.ts': `import { PopupDataAttributes } from './popup.data-attrs.js'
import { FOO } from './constants.js'
export { PopupDataAttributes }
export { FOO as FooDataAttributes }
export { BarDataAttributes } from './bar.js'
`,
    })
    expect(findings.map((f) => f.line)).toEqual([4, 5])
    expect(findings[0]?.message).toContain(
      "Can't tell whether `FooDataAttributes`",
    )
  })

  it('reports a file whose name says neither kind', async () => {
    const findings = await lintWith('bazza/data-attrs-enum', {
      'item.tsx': 'export enum ItemDataAttributes { a = "data-a" }\n',
    })
    expect(findings[0]?.message).toContain("Can't tell whether this is")
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
    const findings = await lintIgnoringPartRules({
      'packages/react/src/part.tsx': hook,
      'packages/react/src/part.test.tsx': hook,
    })
    expect(rules(findings)).toEqual([
      'react-hooks(rules-of-hooks)',
      'react-hooks(rules-of-hooks)',
    ])
  })

  it('accepts hooks in forwardRef render functions named `*Impl`', async () => {
    const findings = await lintIgnoringPartRules({
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
    const findings = await lintIgnoringPartRules({
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
    const findings = await lintIgnoringPartRules({
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
    const findings = await lintIgnoringPartRules({
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
    const findings = await lintIgnoringPartRules({
      'packages/react/src/select/positioner/positioner.tsx': `import { useDirection } from '@base-ui/react/internals/direction-context'
export const a = useDirection // eslint-disable-line no-console
`,
    })
    expect(rules(findings)).toEqual(['bazza(disable-needs-reason)'])
  })

  it('applies the part rules to shipped source only', async () => {
    const shapeless = `import * as React from 'react'
export const Part = React.forwardRef((props, ref) => <div ref={ref} />)
`
    const findings = await lintWithRepoConfig({
      'packages/react/src/part/part.tsx': shapeless,
      'packages/react/src/part/part.test.tsx': shapeless,
      'packages/react/test/harness.tsx': shapeless,
      'packages/react/src/part/part.data-attrs.ts':
        'export const PartDataAttributes = { a: 1 } as const\n',
      'packages/react/src/part/part-context.ts': 'export const a = 1\n',
      'packages/react/src/part/helpers.ts': 'export const a = 1\n',
    })
    expect(
      findings
        .map((f) => `${f.file.replace('packages/react/src/', '')} ${f.rule}`)
        .sort(),
    ).toEqual([
      'part/part-context.ts bazza(use-client)',
      'part/part.data-attrs.ts bazza(data-attrs-enum)',
      'part/part.tsx bazza(forward-ref-named)',
      'part/part.tsx bazza(part-namespace)',
      'part/part.tsx bazza(use-client)',
    ])
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
    expect(await lintIgnoringPartRules({ [path]: source })).toEqual([])
    const elsewhere = path.replace(/[^/]+$/, 'other.tsx')
    expect(await lintIgnoringPartRules({ [elsewhere]: source })).not.toEqual([])
  })
})
