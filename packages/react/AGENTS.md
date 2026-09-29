# @bazza-ui/react

Component patterns based on [Base UI](https://base-ui.com/llms.txt). Source: https://github.com/mui/base-ui/tree/master/packages/react/src

## Folder Structure

```
src/
└── dropdown-menu/
    ├── index.ts             # Namespace export: export * as DropdownMenu from './index.parts.js'
    ├── index.parts.ts       # Part exports: export { DropdownMenuRoot as Root } from './root/root.js'
    ├── root/
    │   └── root.tsx
    ├── item/
    │   ├── item.tsx
    │   └── item.data-attrs.ts
    └── positioner/
        ├── positioner.tsx
        ├── positioner.data-attrs.ts
        └── positioner.css-vars.ts
```

## Component Pattern

```typescript
'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'

export interface MyComponentState extends Record<string, unknown> {
  highlighted: boolean
  disabled: boolean
}

export interface MyComponentProps extends ComponentProps<'div', MyComponentState> {}

export const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  function MyComponent(props, forwardedRef) {
    const { render, className, style, children, ...rest } = props

    const state: MyComponentState = React.useMemo(
      () => ({ highlighted: isHighlighted, disabled }),
      [isHighlighted, disabled],
    )

    return useRender({
      render,
      ref: forwardedRef,
      state,
      props: { ...rest, className, style, children },
      defaultTagName: 'div',
    })
  }
)

export namespace MyComponent {
  export type State = MyComponentState
  export interface Props extends MyComponentProps {}
}
```

Every part follows this shape, and lint checks it:

- **`'use client'` first.** Parts and `*-context.ts` modules use hooks, so a React Server Components app can only import them across a client boundary (`bazza/use-client`, fixable with `bun run check:fix`).
- **A named render function.** Parts don't set `displayName`, so React DevTools and error messages show the function's name. Write `forwardRef(function MyComponent(…))`, or declare a named function and pass it by name, as generic parts do with `forwardRef(MyComponentImpl) as <…>` (`bazza/forward-ref-named`).
- **A namespace with the part's types.** Consumers write `DropdownMenu.Item.Props`, and the docs type tables read the same names. Export `namespace MyComponent { Props }`, plus `State` when the part passes `state` to `useRender` (`bazza/part-namespace`).
- **No default exports.** Parts are reached through their family's namespace (`DropdownMenu.Item`). Biome's `noDefaultExport` is on for `src`.

## State to Data Attributes

Automatic conversion: `highlighted: true` becomes `data-highlighted=""`.

For kebab-case attributes, use `stateAttributesMapping`:

```typescript
import { MyDataAttributes } from './my.data-attrs.js'

const stateAttributesMapping = {
  submenuOpen: (value: unknown) =>
    value ? { [MyDataAttributes.submenuOpen]: '' } : null,
}

return useRender({ render, ref, state, stateAttributesMapping, props, defaultTagName: 'div' })
```

## Data Attributes File

Filename: `<name>.data-attrs.ts`

Export only `enum`s named `*DataAttributes`. The docs type generator (`apps/web/scripts/build-types-meta.ts`) reads nothing else, so an `as const` object renders an empty `DataAttrsTable`. To share an engine part's attributes, re-export its enum by name (`export { PopupMenuPopupDataAttributes } from '…'`), never `export *` (`bazza/data-attrs-enum`).

```typescript
export enum DropdownMenuItemDataAttributes {
  /** Present when the item is highlighted. */
  highlighted = 'data-highlighted',
  /** Present when the item is disabled. */
  disabled = 'data-disabled',
}
```

## CSS Variables File

Filename: `<name>.css-vars.ts`

Export only `enum`s named `*CssVars`, for the same reason as data attributes (`bazza/data-attrs-enum`).

```typescript
export enum DropdownMenuPositionerCssVars {
  /** @type {number} */
  availableWidth = '--available-width',
}
```

## Context Providers

Render element first, then wrap with provider:

```typescript
const element = useRender({ render, ref, props, defaultTagName: 'div' })

return <MyContext.Provider value={contextValue}>{element}</MyContext.Provider>
```

## Conditional Rendering

`useRender` is a hook, so call it on every render and pass `enabled` to skip rendering the element. Return `null` after the call, never before it (`react-hooks/rules-of-hooks` reports an early return before a hook):

```typescript
const element = useRender({ render, ref, props, enabled: isVisible, defaultTagName: 'div' })

if (!isVisible) return null
return element
```

## Lint

`bun run check` runs Biome on the repo, then oxlint on this package. oxlint runs the `bazza/*` rules from `tooling/lint` plus built-in rules that have no active Biome equivalent:

- `react-hooks/rules-of-hooks`. Biome's version (`useHookAtTopLevel`) is off because it misreads `forwardRef` render functions named `*Impl`.
- `no-restricted-imports` for Base UI: import public `@base-ui/react/<component>` and `@base-ui/utils/<helper>` paths only. `@base-ui/react/internals/*` is private and can change in any release.

Rules and their scope live in the root `.oxlintrc.json`. Each `bazza/*` message names the section of this file that describes its convention. `bun run check:fix` applies the fixes that are safe to automate.

When a rule is wrong for one line, disable it for that line and say why:

```typescript
// oxlint-disable-next-line bazza/<rule> -- <why this line is the exception>
```

`bazza/disable-needs-reason` rejects an exception with no rule or no reason, a `bazza/*` exception wider than one line, and `eslint-disable` comments (this repo has no ESLint, and oxlint ignores them).

The `Allowlists` entries in `.oxlintrc.json` list files that broke a rule when it was added. Such a file is exempt from that rule until someone fixes it and deletes its line. Don't add files to an allowlist. New code follows the rules or uses a reasoned `oxlint-disable-next-line`.
