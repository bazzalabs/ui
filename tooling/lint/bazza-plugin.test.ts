import { describe, expect, it } from 'vitest'
import plugin, {
  bazzaRuleNames,
  directiveProblem,
  parseDirective,
  partShapeRuleNames,
} from './bazza-plugin.mjs'
import {
  type Finding,
  fixWith,
  lintWith,
  lintWithRepoConfig,
} from './harness.ts'

const lines = (findings: readonly Finding[]) => findings.map((f) => f.line)
const rules = (findings: readonly Finding[]) => findings.map((f) => f.rule)

/** The part-shape rules, as oxlint reports them. */
const partRules = new Set(
  [...partShapeRuleNames].map((name) => `bazza(${name})`),
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

describe('bazza/resolve-state-props', () => {
  const part = (
    body: string,
    signature = 'props, forwardedRef',
  ) => `import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import { mergeElementProps } from '../utils/merge-element-props.js'
import { composeStyle, resolveClassName, resolveStyle } from '../utils/resolve-state-props.js'
import { visuallyHidden } from '@base-ui/utils/visuallyHidden'
const baseStyle = { color: 'red' }
export const Part = React.forwardRef(function Part(${signature}) {
${body}
})
`

  it('accepts the shapes parts use today', async () => {
    const findings = await lintWith('bazza/resolve-state-props', {
      'a.tsx':
        part(`  const { render, className, style, children, triggerProps, ...rest } = props
  const state = React.useMemo(() => ({ open: true }), [className])
  const slot = rest.id ? { 'data-slot': '' } : {}
  const resolved = resolveStyle(style, state)
  return useRender({
    render,
    ref: forwardedRef,
    state,
    className,
    style,
    props: {
      ...rest,
      ...slot,
      ...(rest.id ? { id: rest.id } : {}),
      ...mergeElementProps<'button'>(triggerProps, { ...rest, className: resolveClassName(className, state) }),
      style: { ...baseStyle, ...visuallyHidden, ...resolved },
      onClick: () => props.onClick?.(),
      children,
    },
    defaultTagName: 'div',
  })`),
    })
    expect(findings).toEqual([])
  })

  it('reports raw values, the props object, and rests that still hold them', async () => {
    const findings = await lintWith('bazza/resolve-state-props', {
      'a.tsx': part(`  const { className, style: styleProp, ...rest } = props
  const { id, ...others } = props
  const alias = styleProp
  return useRender({
    ref: forwardedRef,
    props: {
      className,
      style: alias,
      ...others,
      ...props,
      ...rest,
    },
  })`),
    })
    expect(findings.map((f) => f.line)).toEqual([14, 15, 16, 17])
    expect(findings[0]?.message).toContain('resolveClassName(className, state)')
    expect(findings[1]?.message).toContain('resolveStyle(styleProp, state)')
    expect(findings[2]?.message).toContain('still holds')
  })

  it('reports composeStyle inside props, because it keeps a function a function', async () => {
    const findings = await lintWith('bazza/resolve-state-props', {
      'a.tsx': part(
        '  return useRender({ ref: forwardedRef, props: { style: composeStyle(style, (s) => ({ ...s })) } })',
        '{ className, style }, forwardedRef',
      ),
    })
    expect(findings.map((f) => f.line)).toEqual([8])
    expect(findings[0]?.message).toContain('`composeStyle` keeps a function')
  })

  it("reports what it can't prove: opaque props, helper calls, second-level destructures, hooks", async () => {
    const findings = await lintWith('bazza/resolve-state-props', {
      'a.tsx': `${part(`  const { render, ...other } = props
  const { className, ...rest } = other
  const classes = clsx('base', className)
  const elementProps = usePartProps(props)
  return useRender({
    render,
    ref: forwardedRef,
    props: { ...rest, className: classes, ...elementProps },
  })`)}
export function usePartElement(params: { props: object }) {
  return useRender({ props: { ...params.props } })
}
export function PartTwo(props: object) {
  return useRender({ props: elementPropsOf(props) })
}
`,
    })
    expect(findings.map((f) => [f.line, f.message.split('.')[0]])).toEqual([
      [15, "`rest` still holds the part's `className` or `style`"],
      [
        15,
        '`className` inside `props` must be `resolveClassName(className, state)` or a string',
      ],
      [
        15,
        "Can't tell whether `elementProps` carries the part's unresolved `className` or `style`",
      ],
      [
        20,
        "Can't tell whether this value carries the part's unresolved `className` or `style`",
      ],
      [
        23,
        "Can't tell whether this value carries the part's unresolved `className` or `style`",
      ],
    ])
  })

  it('does not trust a variable that changes after its declaration', async () => {
    const findings = await lintWith('bazza/resolve-state-props', {
      'a.tsx': part(`  const { className, style, ...rest } = props
  const extra: Record<string, unknown> = {}
  if (rest.id) extra.style = style
  const assigned = {}
  Object.assign(assigned, { className })
  let cls = resolveClassName(className, {})
  if (rest.id) cls = className
  const dataAttrs: Record<string, string> = {}
  if (rest.id) dataAttrs['data-open'] = ''
  return useRender({
    ref: forwardedRef,
    props: { ...rest, ...extra, ...assigned, ...dataAttrs, className: cls },
  })`),
    })
    expect(findings.map((f) => f.message.split(' carries')[0])).toEqual([
      "Can't tell whether `extra`, which is reassigned or written to after its declaration,",
      "Can't tell whether `assigned`, which is reassigned or written to after its declaration,",
      "Can't tell whether `cls`, which is reassigned or written to after its declaration,",
    ])
  })

  it('checks writes to parameter rests and through TypeScript wrappers, computed keys, and names the right branch', async () => {
    const findings = await lintWith('bazza/resolve-state-props', {
      'a.tsx': part(
        `  const extra: Record<string, unknown> = {}
  ;(extra as Record<string, unknown>).className = className
  if (rest.id) rest.style = style
  const key = rest.id ? 'className' : 'title'
  return useRender({
    ref: forwardedRef,
    props: { ...extra, ...rest, [key]: className, ...(rest.id ? { id: rest.id } : getExtra()) },
  })`,
        '{ className, style, ...rest }, forwardedRef',
      ),
    })
    expect(findings.map((f) => f.message.split(' carries')[0])).toEqual([
      "Can't tell whether `extra`, which is reassigned or written to after its declaration,",
      "Can't tell whether `rest`",
      "Can't tell whether an entry whose key is computed",
      "Can't tell whether this value",
    ])
  })

  it('carries removed keys through chained destructures', async () => {
    const findings = await lintWith('bazza/resolve-state-props', {
      'a.tsx': part(`  const { className, ...other } = props
  const { style, ...rest } = other
  return useRender({
    ref: forwardedRef,
    props: { ...rest, className: resolveClassName(className, {}), style: resolveStyle(style, {}) },
  })`),
    })
    expect(findings).toEqual([])
  })

  it('checks module-level values used as className, merge arguments, conditionals and Impl parts', async () => {
    const findings = await lintWith('bazza/resolve-state-props', {
      'a.tsx': `import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import { mergeElementProps } from './merge-element-props.js'
import { resolveClassName } from './resolve-state-props.js'
const cls = (state: { open: boolean }) => (state.open ? 'a' : 'b')
function PartImpl(props: { className?: string; open: boolean }, ref: React.Ref<HTMLDivElement>) {
  const { className, open, ...others } = props
  const mergeState = (p: object) => ({ ...p, className })
  return useRender({
    ref,
    props: {
      ...mergeElementProps({}, { ...others }),
      ...mergeState({}),
      className: open ? resolveClassName(className, {}) : className,
    },
  })
}
export const Part = React.forwardRef(PartImpl)
function OtherImpl(props: { className?: string }, ref: React.Ref<HTMLDivElement>) {
  return useRender({ ref, props: { className: cls, ...mergeElementProps({}, { ...props, ...makeExtra() }) } })
}
export const Other = React.forwardRef(OtherImpl)
`,
    })
    expect(findings.map((f) => [f.line, f.message.split('.')[0]])).toEqual([
      [12, "`others` still holds the part's `className` or `style`"],
      [
        13,
        "Can't tell whether this value carries the part's unresolved `className` or `style`",
      ],
      [14, "`className` is the part's unresolved `className`"],
      [
        20,
        '`className` inside `props` must be `resolveClassName(className, state)` or a string',
      ],
      [20, "`props` still holds the part's `className` or `style`"],
      [
        20,
        "Can't tell whether this value carries the part's unresolved `className` or `style`",
      ],
    ])
  })

  it("reports options it can't read", async () => {
    const findings = await lintWith('bazza/resolve-state-props', {
      'a.tsx': part(`  const options = { ref: forwardedRef, props }
  return useRender(options)`),
    })
    expect(findings.map((f) => f.line)).toEqual([9])
    expect(findings[0]?.message).toContain(
      "Can't tell whether `useRender`'s options",
    )
  })
})

describe('bazza/no-spread-style', () => {
  it("reports spreading a part's style, including in callbacks, aliases and ?? wrappers", async () => {
    const findings = await lintWith('bazza/no-spread-style', {
      'a.tsx': `import * as React from 'react'
export const A = React.forwardRef(function A({ style: styleProp }: { style?: object }, ref) {
  const alias = styleProp
  const measured = React.useMemo(() => ({ ...styleProp, transition: 'none' }), [styleProp])
  return <div ref={ref} style={{ ...(alias ?? {}), ...measured }} />
})
export const B = React.forwardRef(function B(props: { style?: object; child: React.ReactElement<{ style?: object }> }, ref) {
  return <div ref={ref} style={{ ...props.style, ...props.child.props.style }} />
})
`,
    })
    expect(findings.map((f) => f.line)).toEqual([4, 5, 8, 8])
  })

  it('reports composeStyle results, destructures of a props alias, optional chains and plain components', async () => {
    const findings = await lintWith('bazza/no-spread-style', {
      'a.tsx': `import * as React from 'react'
import { composeStyle } from './resolve-state-props.js'
export const A = React.forwardRef(function A(props: { style?: object }, ref) {
  const p = props
  const { style: s } = p
  const composed = composeStyle(s, (r) => ({ ...r }))
  return <div ref={ref} style={{ ...composed, ...s, ...props?.style }} />
})
export function Plain({ style }: { style?: object }) {
  return <div style={{ ...style }} />
}
`,
    })
    expect(findings.map((f) => f.line)).toEqual([7, 7, 7, 10])
  })

  it('reports a style variable reassigned later and a style read through a props alias', async () => {
    const findings = await lintWith('bazza/no-spread-style', {
      'a.tsx': `export function Plain(props: { style?: object }) {
  const p = props
  let s = props.style
  if (!s) s = {}
  return <div style={{ ...s, ...p.style, ...p['style'] }} />
}
`,
    })
    expect(findings.map((f) => f.line)).toEqual([5, 5, 5])
  })

  it('accepts resolved styles and props a Base UI render callback receives', async () => {
    const findings = await lintWith('bazza/no-spread-style', {
      'a.tsx': `import * as React from 'react'
import { composeStyle, resolveStyle } from './resolve-state-props.js'
const base = { color: 'red' }
export const A = React.forwardRef(function A({ style, ...rest }: { style?: object; id?: string }, ref) {
  const resolved = resolveStyle(style, {})
  return (
    <Slider
      ref={ref}
      {...rest}
      style={composeStyle(style, (s) => ({ ...s, ...base, ...resolved }))}
      render={(baseProps: { style?: object }) => <div style={{ ...baseProps.style }} />}
    />
  )
})
export function helper(item: { style?: object }) {
  return { ...item.style }
}
`,
    })
    expect(findings).toEqual([])
  })
})

describe('bazza/context-hook-contract', () => {
  it('accepts hooks that throw, fall back, or say Maybe, and non-null contexts', async () => {
    const findings = await lintWith('bazza/context-hook-contract', {
      'a-context.ts': `import * as React from 'react'
import { createContext, useContext } from 'react'
const Ctx = React.createContext<{ a: 1 } | null>(null)
const Other = createContext<{ b: 1 } | undefined>(undefined)
const WithDefault = React.createContext({ c: 1 })
export function useCtx() {
  const context = React.useContext(Ctx)
  if (!context) {
    throw new Error('Part must be used within Root')
  }
  return context
}
export const useOther = () => {
  const value = useContext(Other) as { b: 1 } | undefined
  if (value === undefined) throw new Error('Part must be used within Root')
  return value
}
export function useCtxOrDefault() {
  return React.useContext(Ctx) ?? { a: 1 as const }
}
export function useMaybeCtx() {
  return React.useContext(Ctx)
}
export function useWithDefault() {
  return React.useContext(WithDefault)
}
`,
    })
    expect(findings).toEqual([])
  })

  it('reports hooks that can hand back a missing context', async () => {
    const findings = await lintWith('bazza/context-hook-contract', {
      'a-context.ts': `import * as React from 'react'
import { useContext as useCtxHook } from 'react'
const Ctx = React.createContext<{ a: 1; disabled?: boolean } | null>(null)
export function useDirect() {
  return React.useContext(Ctx)
}
export const useInline = () => useCtxHook(Ctx)!
export function useOptional(optional = false) {
  const ctx = React.useContext(Ctx)
  if (!ctx && !optional) throw new Error('x')
  return ctx
}
export function useDevOnly() {
  const ctx = React.useContext(Ctx)
  if (!ctx) {
    if (process.env.NODE_ENV !== 'production') throw new Error('x')
  }
  return ctx
}
export function useWrongMissing() {
  const ctx = React.useContext(Ctx)
  if (ctx === undefined) throw new Error('x')
  return ctx
}
export function useProperty(props: { ctx?: 1 }) {
  const ctx = React.useContext(Ctx)
  if (!props.ctx) throw new Error('x')
  return ctx
}
export function useEarlyReturn(flag: boolean) {
  const ctx = React.useContext(Ctx)
  if (flag) return ctx
  if (!ctx) throw new Error('x')
  return ctx
}
export function useNullFallback() {
  return React.useContext(Ctx) ?? null
}
export function useIsInside() {
  return React.useContext(Ctx) !== null
}
`,
    })
    expect(findings.map((f) => [f.line, f.message.split(' ')[0]])).toEqual([
      [5, '`useDirect`'],
      [7, '`useInline`'],
      [9, "Can't"],
      [14, "Can't"],
      [21, "Can't"],
      [26, '`useProperty`'],
      [31, "Can't"],
      [37, '`useNullFallback`'],
    ])
    expect(findings[2]?.message).toContain(
      "Can't tell whether `useOptional` handles a missing `Ctx`",
    )
    expect(findings[2]?.message).not.toContain('useMaybe')
    expect(findings[0]?.message).toContain('rename the hook `useMaybeDirect`')
  })

  it('accepts every proof shape, derived values and nested helpers', async () => {
    const findings = await lintWith('bazza/context-hook-contract', {
      'a-context.ts': `import * as React from 'react'
const NullCtx = React.createContext<{ a: 1 } | null>(null)
const NoArgCtx = React.createContext<{ a: 1 } | undefined>()
export function useLooseEquals() {
  const ctx = React.useContext(NullCtx)
  if (ctx == null) throw new Error('x')
  return ctx
}
export function useStrictNull() {
  const ctx = React.use(NullCtx)
  if (ctx === null) {
    const message = 'Part must be used within Root'
    console.error(message)
    throw new Error(message)
  }
  return ctx
}
export function useNoArg() {
  const ctx = React.useContext(NoArgCtx)
  function label() {
    return 'x'
  }
  if (ctx === undefined) throw new Error(label())
  return ctx
}
export function useStringFallback() {
  return React.useContext(NullCtx) ?? 'none'
}
export function useIsInside() {
  return React.useContext(NullCtx) !== null
}
export function useDepth() {
  return React.useContext(NullCtx)?.a ?? 0
}
`,
    })
    expect(findings).toEqual([])
  })

  it('checks the variable that holds the context, default exports, and contexts by scope', async () => {
    const findings = await lintWith('bazza/context-hook-contract', {
      'a-context.ts': `import * as React from 'react'
const Ctx = React.createContext<{ a: 1 } | null>(null)
const Other = React.createContext<{ b: 1 } | null>(null)
export const useCrashes = () => React.useContext(Ctx)!.a
export function useInvariant() {
  const ctx = React.useContext(Ctx)
  invariant(ctx, 'Part must be used within Root')
  return ctx
}
export function useVariableFallback() {
  return React.useContext(Ctx) ?? fallbackCtx
}
export function useWrongVariable() {
  const ctx = React.useContext(Ctx)
  const other = React.useContext(Other)
  if (!other) throw new Error('x')
  return ctx
}
export function useShadowed<T>(Ctx: React.Context<T>) {
  return React.useContext(Ctx)
}
export default function useDefault() {
  return React.useContext(Ctx)
}
`,
    })
    expect(findings.map((f) => [f.line, f.message.split(' ')[0]])).toEqual([
      [4, "Can't"],
      [6, "Can't"],
      [11, "Can't"],
      [14, '`useWrongVariable`'],
      [23, '`useDefault`'],
    ])
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
    const hookContext = `'use client'
import * as React from 'react'
const Ctx = React.createContext<{ a: 1 } | null>(null)
export function useCtx() {
  return React.useContext(Ctx)
}
`
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
      'packages/react/src/part/hook-context.ts': hookContext,
      'packages/react/src/part/hook.test.tsx': hookContext,
      'packages/react/test/hook-context.ts': hookContext,
      'packages/react/src/part/helpers.ts': 'export const a = 1\n',
    })
    expect(
      findings
        .map((f) => `${f.file.replace('packages/react/src/', '')} ${f.rule}`)
        .sort(),
    ).toEqual([
      'part/hook-context.ts bazza(context-hook-contract)',
      'part/part-context.ts bazza(use-client)',
      'part/part.data-attrs.ts bazza(data-attrs-enum)',
      'part/part.tsx bazza(forward-ref-named)',
      'part/part.tsx bazza(part-namespace)',
      'part/part.tsx bazza(use-client)',
    ])
  })

  it('runs the correctness rules on tests and honours the style allowlist', async () => {
    const source = `import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
export const Part = React.forwardRef(function Part({ className, style }: { className?: string; style?: object }, ref) {
  const s = { ...style }
  return useRender({ ref, props: { className, style: s } })
})
`
    const findings = await lintIgnoringPartRules({
      'packages/react/src/part.test.tsx': source,
      'packages/react/test/harness.tsx': source,
      'packages/react/src/combobox/positioner/positioner.tsx': source,
    })
    expect(findings.map((f) => `${f.file} ${f.rule}`).sort()).toEqual([
      'packages/react/src/combobox/positioner/positioner.tsx bazza(resolve-state-props)',
      'packages/react/src/combobox/positioner/positioner.tsx bazza(resolve-state-props)',
      'packages/react/src/part.test.tsx bazza(no-spread-style)',
      'packages/react/src/part.test.tsx bazza(resolve-state-props)',
      'packages/react/src/part.test.tsx bazza(resolve-state-props)',
      'packages/react/test/harness.tsx bazza(no-spread-style)',
      'packages/react/test/harness.tsx bazza(resolve-state-props)',
      'packages/react/test/harness.tsx bazza(resolve-state-props)',
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
