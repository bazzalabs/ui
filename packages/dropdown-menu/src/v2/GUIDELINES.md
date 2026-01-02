# Dropdown Menu v2 Codebase Guidelines

This document outlines the coding conventions for the v2 dropdown menu implementation, inspired by [Base UI's menu implementation](https://github.com/mui/base-ui/tree/master/packages/react/src/menu).

## File Structure

```
src/v2/
├── components/
│   ├── index.ts           # Re-exports all components
│   ├── index.parts.ts     # Named exports for namespace pattern (Menu.*)
│   ├── root.tsx
│   ├── trigger.tsx
│   ├── item.tsx
│   └── ...
├── contexts/
│   ├── index.ts
│   ├── menu-context.tsx
│   └── ...
├── hooks/
│   ├── index.ts
│   └── ...
├── utils/
│   ├── index.ts
│   └── ...
├── index.ts               # Main entry point
├── types.ts               # Shared types
└── GUIDELINES.md
```

## Component Namespace Pattern

Each component should export both the component and its associated types in a namespace pattern, allowing consumers to access them as `Menu.Item`, `Menu.Item.Props`, `Menu.Item.State`.

### Example Component Structure

```tsx
// item.tsx
import * as React from 'react'

/**
 * An individual interactive item in the menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const Item = React.forwardRef(function Item(
  props: Item.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  // ... implementation
  
  const state: Item.State = React.useMemo(
    () => ({
      disabled,
      highlighted,
    }),
    [disabled, highlighted],
  )
  
  return (
    <div
      ref={forwardedRef}
      data-disabled={state.disabled || undefined}
      data-highlighted={state.highlighted || undefined}
      {...props}
    >
      {children}
    </div>
  )
})

// ============================================================================
// Types
// ============================================================================

export interface ItemState {
  /**
   * Whether the item should ignore user interaction.
   */
  disabled: boolean
  /**
   * Whether the item is currently highlighted.
   */
  highlighted: boolean
}

export interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
  /**
   * Unique identifier for this item.
   */
  id?: string
  /**
   * Text value for search/typeahead (auto-derived from children if not provided).
   */
  textValue?: string
  /**
   * Additional keywords for search.
   */
  keywords?: string[]
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean
  /**
   * Callback when the item is selected.
   */
  onSelect?: () => void
  /**
   * Whether to close the menu when selected.
   * @default true
   */
  closeOnSelect?: boolean
}

// ============================================================================
// Namespace
// ============================================================================

export namespace Item {
  export type Props = ItemProps
  export type State = ItemState
}
```

## index.parts.ts

Create an `index.parts.ts` file that exports components with their short names for the namespace pattern:

```tsx
// components/index.parts.ts
export { Root } from './root'
export { Trigger } from './trigger'
export { Portal } from './portal'
export { Positioner } from './positioner'
export { Surface } from './surface'
export { Item } from './item'
export { Group } from './group'
export { Label } from './label'
export { Separator } from './separator'
export { Submenu } from './submenu'
export { CheckboxItem } from './checkbox-item'
export { RadioGroup, RadioItem } from './radio-group'
export { Input } from './input'
```

## Data Attributes

Document all data attributes as part of the component's State interface and JSDoc. Use consistent naming:

### Standard Data Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `data-disabled` | `boolean` | Present when the component is disabled |
| `data-highlighted` | `boolean` | Present when the item is highlighted (focused) |
| `data-checked` | `boolean` | Present when a checkbox/radio item is checked |
| `data-open` | `boolean` | Present when a submenu trigger's submenu is open |
| `data-menu-surface` | `string` | Marks an element as a menu surface for InteractionGuard |

### Example Documentation

```tsx
export interface ItemState {
  /**
   * Whether the item should ignore user interaction.
   * 
   * @cssattribute data-disabled
   */
  disabled: boolean
  /**
   * Whether the item is currently highlighted.
   * 
   * @cssattribute data-highlighted
   */
  highlighted: boolean
}
```

## CSS Custom Properties

Document CSS custom properties (variables) that components expose:

```tsx
/**
 * The menu positioner component.
 *
 * @cssvar --menu-anchor-width - The width of the trigger element.
 * @cssvar --menu-anchor-height - The height of the trigger element.
 * @cssvar --menu-available-width - Available width before overflow.
 * @cssvar --menu-available-height - Available height before overflow.
 * @cssvar --menu-transform-origin - The transform origin for animations.
 */
export const Positioner = React.forwardRef(/* ... */)
```

## State Management

### Component State

Each component that has visual states should:

1. Define a `State` interface describing the state shape
2. Compute the state object with `useMemo`
3. Apply state as data attributes to the root element

```tsx
const state: Item.State = React.useMemo(
  () => ({
    disabled,
    highlighted,
  }),
  [disabled, highlighted],
)

return (
  <div
    data-disabled={state.disabled || undefined}
    data-highlighted={state.highlighted || undefined}
  >
    {children}
  </div>
)
```

### Context State

Use dedicated context files for shared state:

- `menu-context.tsx` - Root menu state (open, highlighted item, search, etc.)
- `submenu-context.tsx` - Submenu-specific state
- `collection-context.tsx` - Item registration and collection management

## Props Interface Conventions

### JSDoc Comments

Every prop should have a JSDoc comment describing:
- What the prop does
- The default value (using `@default`)
- Any relevant CSS attributes (using `@cssattribute`)

```tsx
export interface ItemProps {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean
  
  /**
   * Whether to close the menu when the item is selected.
   * @default true
   */
  closeOnSelect?: boolean
}
```

### Extending HTML Element Props

Use `React.ComponentPropsWithoutRef<'element'>` for extending native element props:

```tsx
export interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
  // component-specific props
}
```

When you need to omit certain props:

```tsx
export interface SurfaceProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  children?: React.ReactNode
  loop?: boolean
}
```

## Rendering Pattern

### forwardRef

All components that render DOM elements should use `forwardRef`:

```tsx
export const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  function Item(props, forwardedRef) {
    // ...
  }
)

Item.displayName = 'Menu.Item'
```

### Composing Refs

When you need to combine multiple refs:

```tsx
const composedRef = React.useCallback(
  (node: HTMLDivElement | null) => {
    if (typeof forwardedRef === 'function') {
      forwardedRef(node)
    } else if (forwardedRef) {
      forwardedRef.current = node
    }
    internalRef.current = node
  },
  [forwardedRef],
)
```

## Search/Filter Behavior

All navigable items (Item, SubmenuTrigger, RadioItem, CheckboxItem) should:

1. Register with the collection via `useRegisterNode`
2. Check visibility based on search results
3. Return `null` if filtered out

```tsx
// Whether this item should be visible (based on search)
const isInSearchResults =
  !state.searchMode ||
  state.searchResults.some((result) => result.node.id === id)

// Don't render if filtered out by search
if (!isInSearchResults) {
  return null
}
```

## Event Handling

### Pointer Events

Use `onPointerMove` and `onPointerEnter` for highlight management (not `onMouseMove`/`onMouseEnter`):

```tsx
const handlePointerMove = React.useCallback(
  (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event)
    if (event.defaultPrevented || disabled) return
    if (state.highlightedId !== id) {
      actions.setHighlightedId(id, 'pointer')
    }
  },
  [onPointerMove, disabled, state.highlightedId, id, actions],
)
```

### Keyboard Events

Handle standard menu keyboard interactions:
- `ArrowDown` / `ArrowUp` - Navigate items
- `ArrowRight` - Open submenu
- `ArrowLeft` - Close submenu (return to parent)
- `Enter` / `Space` - Select item
- `Escape` - Close menu
- `Home` / `End` - Jump to first/last item

## Testing

- Unit tests go in `__tests__/` directories
- E2E tests go in `e2e/` directories
- Use `vitest` for unit tests
- Use `playwright` for E2E tests

## Migration Notes

When porting from v1 to v2:

1. Replace data-driven API with composable JSX components
2. Convert `menu` config objects to nested `<Menu.*>` components
3. Move callbacks from config to component props
4. Use CSS classes + data attributes instead of theme system
