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
import { useRender } from '@base-ui/react/use-render'
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

Check visibility before useRender, not with `enabled` parameter:

```typescript
if (!isVisible) return null
return useRender({ render, ref, props, defaultTagName: 'div' })
```
