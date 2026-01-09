Based on Base UI's component library patterns with kebab-case file naming.

## Folder Structure

```
src/
└── dropdown-menu/
    ├── index.ts           # Namespace export: export * as DropdownMenu from './index.parts.js'
    ├── index.parts.ts     # Part exports: export { DropdownMenuRoot as Root } from './root/root.js'
    ├── root/
    │   ├── root.tsx
    │   └── root.context.ts
    ├── trigger/
    │   ├── trigger.tsx
    │   └── trigger.data-attrs.ts
    ├── positioner/
    │   ├── positioner.tsx
    │   ├── positioner.data-attrs.ts
    │   └── positioner.css-vars.ts
    └── content/
        └── content.tsx
```

## Type Namespace Pattern

```typescript
export interface DropdownMenuRootProps { /* ... */ }
export interface DropdownMenuRootState { /* ... */ }
export function DropdownMenuRoot(props: DropdownMenuRoot.Props) { /* ... */ }
export namespace DropdownMenuRoot {
  export type Props = DropdownMenuRootProps
  export type State = DropdownMenuRootState
}
```

## Data Attributes 

Filename: <name>.data-attrs.ts

```typescript
export enum DropdownMenuTriggerDataAttributes {
  /** Present when the dropdown menu is open. */
  popupOpen = 'data-popup-open',
}
```

## CSS Variables 

Filename: <name>.css-vars.ts

```typescript
export enum DropdownMenuPositionerCssVars {
  /** @type {number} */
  availableWidth = '--available-width',
  /** @type {number} */
  anchorWidth = '--anchor-width',
}
```
