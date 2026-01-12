# General

- Use `bun run type-check` to check types using `tsc`

# Structing components and files

Based on Base UI's component library patterns with kebab-case file naming.

## Folder Structure

```
src/
├── utils/
│   └── types.ts             # Shared types (ComponentProps, ComponentRenderFn)
└── dropdown-menu/
    ├── index.ts             # Namespace export: export * as DropdownMenu from './index.parts.js'
    ├── index.parts.ts       # Part exports: export { DropdownMenuRoot as Root } from './root/root.js'
    ├── root/
    │   └── root.tsx
    ├── item/
    │   ├── item.tsx
    │   └── item.data-attrs.ts
    ├── positioner/
    │   ├── positioner.tsx
    │   ├── positioner.data-attrs.ts
    │   └── positioner.css-vars.ts
    └── ...
```

## Type Namespace Pattern

```typescript
export interface DropdownMenuItemState extends Record<string, unknown> {
  highlighted: boolean
  disabled: boolean
}

export interface DropdownMenuItemProps
  extends ComponentProps<'div', DropdownMenuItemState> {
  // Component-specific props
}

export const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  function DropdownMenuItem(props, forwardedRef) { /* ... */ }
)

export namespace DropdownMenuItem {
  export type State = DropdownMenuItemState
  export interface Props extends DropdownMenuItemProps {}
}
```

## useRender Hook Pattern

Components use Base UI's `useRender` hook from `@base-ui/react/use-render` for:
- Render prop support (element replacement)
- State-based className/style functions
- Automatic state-to-data-attribute conversion
- Ref merging

### Basic Usage

```typescript
import { useRender } from '@base-ui/react/use-render'
import type { ComponentProps } from '../../utils/types.js'

export interface MyComponentState extends Record<string, unknown> {
  highlighted: boolean
  disabled: boolean
}

export interface MyComponentProps extends ComponentProps<'div', MyComponentState> {
  // additional props
}

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
      props: {
        ...rest,
        role: 'option',
        className,
        style,
        children,
      },
      defaultTagName: 'div',
    })
  }
)
```

### State-to-Data-Attribute Conversion

State properties are automatically converted to data attributes:
- `highlighted: true` → `data-highlighted=""`
- `disabled: true` → `data-disabled=""`
- `open: false` → (attribute not present)

Property names are lowercased: `submenuOpen: true` → `data-submenuopen=""`

### Custom Attribute Mapping

For kebab-case attribute names, use `stateAttributesMapping`:

```typescript
import { DropdownMenuSubmenuTriggerDataAttributes } from './submenu-trigger.data-attrs.js'

const stateAttributesMapping = {
  submenuTrigger: (value: unknown) =>
    value ? { [DropdownMenuSubmenuTriggerDataAttributes.submenuTrigger]: '' } : null,
  submenuOpen: (value: unknown) =>
    value ? { [DropdownMenuSubmenuTriggerDataAttributes.submenuOpen]: '' } : null,
}

return useRender({
  render,
  ref: forwardedRef,
  state,
  stateAttributesMapping,
  props: { /* ... */ },
  defaultTagName: 'div',
})
```

### Render Prop Usage (Consumer)

```tsx
// Replace element type
<DropdownMenu.Item render={<button />}>Click me</DropdownMenu.Item>

// Access state in render function
<DropdownMenu.Item
  render={(props, state) => (
    <button {...props}>
      {state.highlighted ? '→ ' : ''}{props.children}
    </button>
  )}
>
  Item
</DropdownMenu.Item>

// State-based className
<DropdownMenu.Item className={(state) => state.highlighted ? 'highlighted' : ''} />

// State-based style
<DropdownMenu.Item style={(state) => ({ opacity: state.disabled ? 0.5 : 1 })} />
```

## ComponentProps Type

Located in `src/utils/types.ts`:

```typescript
export type ComponentProps<
  ElementType extends React.ElementType,
  State,
  RenderFunctionProps = HTMLProps,
> = Omit<React.ComponentPropsWithRef<ElementType>, 'className' | 'color' | 'defaultValue' | 'defaultChecked'> & {
  className?: string | ((state: State) => string | undefined)
  render?: ComponentRenderFn<RenderFunctionProps, State> | React.ReactElement
  style?: React.CSSProperties | ((state: State) => React.CSSProperties | undefined)
}
```

## Data Attributes

Filename: `<name>.data-attrs.ts`

Data attribute enums document available attributes and provide values for custom mappings:

```typescript
export enum DropdownMenuItemDataAttributes {
  /** Present when the item is highlighted. */
  highlighted = 'data-highlighted',
  /** Present when the item is disabled. */
  disabled = 'data-disabled',
}
```

For simple boolean states (highlighted, disabled), the default conversion works.
For kebab-case names (data-submenu-trigger), use the enum with stateAttributesMapping.

## CSS Variables

Filename: `<name>.css-vars.ts`

```typescript
export enum DropdownMenuPositionerCssVars {
  /** @type {number} */
  availableWidth = '--available-width',
  /** @type {number} */
  anchorWidth = '--anchor-width',
}
```

## Components with Context Providers

When a component wraps children with a context provider, render the element first, then wrap:

```typescript
const element = useRender({
  render,
  ref: forwardedRef,
  props: { ...rest, children },
  defaultTagName: 'div',
})

return (
  <MyContext.Provider value={contextValue}>
    {element}
  </MyContext.Provider>
)
```

## Conditional Rendering

For components that conditionally render (e.g., based on visibility):

```typescript
// Check visibility BEFORE calling useRender
if (!isVisible) return null

return useRender({
  render,
  ref: forwardedRef,
  props: { /* ... */ },
  defaultTagName: 'div',
})
```

Don't use the `enabled` parameter if the result is passed to another component's render prop (like `Popover.Trigger`), as it returns `null` which may not be accepted.
