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
import { resolveClassName, resolveStyle } from '../../utils/resolve-state-props.js'
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
      props: {
        ...rest,
        className: resolveClassName(className, state),
        style: resolveStyle(style, state),
        children,
      },
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
- **`className` and `style` resolved before `props`.** Both can be functions of the part's state, and `useRender` only resolves functions passed at the top level of its options, not inside `props` (`bazza/resolve-state-props`). The rule has to prove each piece of `props` safe, and reports what it can't:
  - `className` is `resolveClassName(className, state)` or a string, and `style` is `resolveStyle(style, state)` or an object whose spreads are. `composeStyle` is not allowed here, because it keeps a function a function.
  - Every spread is an object literal, a `mergeProps` / `mergeElementProps` call, a rest object that destructured both out (`const { className, style, ...rest } = props`), another prop, or an import.
  - A local variable counts as its initialiser only while nothing changes it. Any later write makes it unprovable (reassignment, `Object.assign(x, …)`, `delete`, `++`, or writing to `className` / `style`), except writing a literal to another key, as when filling in data attributes (`attrs['data-open'] = ''`). Build the value in one expression, or use a reasoned `oxlint-disable-next-line`.
  - An entry with a computed key (`[key]: value`) needs a literal value, because the key could be `className` or `style`.

## State to Data Attributes

The snippets below write `props` for the object literal from the Component Pattern (`{ ...rest, className: resolveClassName(className, state), … }`), never the part's raw props.

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

Export only `enum`s named `*DataAttributes`. The docs type generator (`apps/web/scripts/build-types-meta.ts`) reads nothing else, so an `as const` object renders an empty `DataAttrsTable`. To share an engine part's attributes, re-export its enum by name (`export { PopupMenuPopupDataAttributes } from '…'`), never `export *` (`bazza/data-attrs-enum`). The re-export must come from the engine part's own data-attrs file, which is a deep import the Layers rule forbids in a member, so that one line carries a reasoned `// oxlint-disable-next-line no-restricted-imports -- …`, as `select/popup/popup.data-attrs.ts` does.

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

## Composing styles

A part's `style` can be a function of its state, and spreading a function copies nothing, so `{ ...style, transition: 'none' }` silently drops the consumer's styles (`bazza/no-spread-style`). Resolve it first, or compose it when a Base UI component resolves it later:

```typescript
// The part renders the element: resolve against its own state.
style: { ...internalStyles, ...resolveStyle(style, state) }

// A Base UI component receives it: keep a function a function.
<Popover.Positioner style={composeStyle(style, (resolved) => ({ ...resolved, transition: 'none' }))} />
```

## Context hooks

A part's context is created with a `null` default, so it's missing when the part renders outside its provider. Each context gets a hook that promises a value, and optionally one that doesn't:

```typescript
const SelectContext = React.createContext<SelectContextValue | null>(null)

export function useSelectContext(): SelectContextValue {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error('Select components must be used within a Select.Root')
  }
  return context
}

export function useMaybeSelectContext(): SelectContextValue | null {
  return React.useContext(SelectContext)
}
```

A hook named `useX` that reads such a context either reads it into a variable and, before any `return`, checks that variable (`!context`, `context == null`, or `=== null` for a `null` default) and throws, or falls back with `??` to a value that can't be `null`. A hook that can return the missing context is named `useMaybeX` (`bazza/context-hook-contract`).

## Context Providers

Render element first, then wrap with provider:

```typescript
const element = useRender({ render, ref, props, defaultTagName: 'div' })

return <MyContext.Provider value={contextValue}>{element}</MyContext.Provider>
```

## Tier contexts

The menu engine's parts read two contexts, one per tier. Every field of a tier is set when the tier is made and never changes; what changes is read through a store selector. Never write a tier field, or a store's state, while rendering.

- **The tree tier**, `MenuTreeContext`: a `MenuTreeTier` (`internal/popup-menu/contexts/menu-tree-context.ts`) that `PopupMenuProviders` makes with the root's first props. It holds the root's `MenuTreeStore` (`useMenuTree()`), its component name (`useMaybeComponentName()`), its settings, a store whose debug flags are synced from later props with `useSyncedValue` (`usePopupMenuDebug()`), its aim guard (`useAimGuard()`, `useAimGuardState()`) and its focus zones (`useMaybeFocusZoneRegistry()`).
- **The surface tier**, `SurfaceTierContext`: a `MenuSurfaceTier` (`internal/popup-menu/contexts/surface-tier-context.ts`), one per surface store, made where the store is (`PopupMenuProviders`, `SubmenuRoot`, `Subpage`). It holds the submenu (`useSubmenuContext()`; its open state and `closeRootOnEsc` are store state, and every caller in a render gets the same value) and the surface's checkbox selection (`useCheckboxSelection()`), made with the tier. A Surface claims the selection when it mounts (`selection.claim(owner)` from a layout effect): a new Surface starts it fresh, and the same Surface shown again by `<Activity>` or after Fast Refresh keeps it. Find the tier a row belongs to by its Surface's store, `findSurfaceTier(tier, store)`: a submenu trigger sits under its submenu's tier.

A tier is provided above its popup, positioner and trigger, so it reaches parts a Surface or List doesn't. What only a Surface's or List's children may read keeps a provider of its own: a data-first Surface's loader scope (`LoaderScopeContext`, read by `useAsyncMenuCoordinator()`), which the popup's subpage outlet and parts beside the Surface don't see, and a data-first List's rows (`CollectionRowsContext`). The loader scope lives while the Surface shows its content (`useLoaderScope(tree, store, isDataMode && isSurfaceActive)`): a subpage that hides the Surface drops it from the tree, and the Surface gets a new one when it shows again.

Read a store a part may not have (outside a tree, a submenu or a data-first Surface) with `useMaybeStore(store, selector, fallback, arg)` (`internal/popup-menu/hooks/use-maybe-store.ts`), not a module-level idle store of your own.

Don't add a context for new engine state that a whole tier shares: put it on the tier, and read what changes through a store selector. The published context objects (`PopupMenuContext`, `ListboxContextProvider`, `PopupSurfaceIdContext`, `SubpageStackContext`, `DataPopupContext`, `SurfaceContext`, `GroupContext`, `RowWidthContext`, `DataSurfaceContext`, `DataListContext`, `ItemContext`) are still provided where they were, with the same values; `SubpageContext` stays a context until the subpage stack lives in a store. `provider-nest.test.tsx` pins the providers above a row.

## Conditional Rendering

`useRender` is a hook, so call it on every render and pass `enabled` to skip rendering the element. Return `null` after the call, never before it (`react-hooks/rules-of-hooks` reports an early return before a hook):

```typescript
const element = useRender({ render, ref, props, enabled: isVisible, defaultTagName: 'div' })

if (!isVisible) return null
return element
```

## Store state

`ListboxStore` (the store behind every menu, select, and combobox) keeps each controlled value, `open` and `search`, in a `ControlledCell` from `@bazza-ui/menu-core`: the internal value and the prop's. The cells are private members of the store, so nothing outside it reads a stale internal value. State mirrors them: `open` and `search` are the effective values (the prop's while it controls them), `openProp` and `searchProp` the props'. Read them through the selectors:

```typescript
if (!store.select('open')) return          // in handlers, effects, and store methods
const open = store.useState('open')        // in render
```

A menu root's `open` lives in its tree instead. `MenuTreeStore` (`internal/popup-menu/store/MenuTreeStore.ts`, one per root, shared by its submenus) keeps the root's open cell, and owns the tree's `openChain` (an `OpenChainStore`), its `focusOwner` (a `FocusOwnerStore`) and its element registry. `usePopupMenuRoot` makes the tree and the root surface's `ListboxStore` with it (`tree.createRootStore()`, which attaches the tree as the store's open owner with `attachOpenOwner` in `internal/listbox/store/ListboxStore.ts`). The store hands its `setOpen` and `useControlledProp('openProp', …)` to the tree, and the tree's cell writes the store's `open`, `openProp` and `openMethod` directly, through the same `changeOpen` and `controlCell` a store uses for its own cell, so the store's state is the only copy and `store.select('open')` reads it. Submenu, subpage and standalone stores keep their own cell. The root returns `tree.openChain` and `tree.focusOwner` as `openChainStore` and `focusOwnerStore`, and `PopupMenuProviders` puts a tree around the ones it's given (the root's own tree when they're its own; otherwise a tree around them that shares the root's elements), so a consumer's write through `useOpenChain()` or `useFocusOwner()`, or a store it supplies, reaches the engine. Parts read the tree with `useMenuTree()`, or its stores with `useOpenChain()` and `useFocusOwner()`, which return `tree.openChain` and `tree.focusOwner`. `MenuTreeStore` stays off the published types; only `FocusOwnerStore` is exported by name, and `OpenChainStore`'s type is reachable through `useOpenChain`.

The tree also owns the root's resolver (`tree.resolver`), each data surface's loader results (a Loader Scope, `tree.updateLoaders`), each popup's data-first state (`tree.updatePopup`, from which `DataPopupProvider` derives `DataPopupContext`) and one tree-wide `version`. A data list registers a grafter for its surface's scope (`tree.setGrafter`), so a loader result is grafted into the resolved tree in the store update that records it, and `version` changes in that update. A change the list's resolution makes while rendering (static content, ADR-0002) is published with `tree.publishResolved()` from a layout effect, before paint. Read the resolved tree from the store: a list keys its derived state on its Tree Slice (`useResolution`) together with its coordinator, which changes with every store-time graft of its scope; the root list republishes its popup's slot on `version` too, after every graft, which replaces a slot a consumer set with `setResolvedNodes`; the popup's subpage outlet keys on the `graftVersion` of the slot `DataPopupContext` derives from `version`. Never lift resolved nodes up with React state, and never bump a counter from a passive effect to signal a graft: that renders the graft one commit late.

Only the store that owns a cell writes it and its mirrors, in one update, in three places:

- `setOpen` calls `changeOpen` (`internal/listbox/store/ListboxStore.ts`, shared by `ListboxStore` and `MenuTreeStore`), which calls `changeCell`: the consumer's `onOpenChange` runs first, and a canceled change, or one to a controlled value, leaves the cell as it is.
- `setSearch` updates the cell, then calls `onSearchChange`, so the highlight change a new search causes is reported first.
- `store.useControlledProp('openProp', openProp)`, which each root calls, and `useControlledProp('searchProp', …)`, which the surface calls, sync the prop into the cell with `controlCell` (for a root's `open`, through the tree's `control`).

Never write `open`, `search`, `openProp` or `searchProp` yourself with `set`, `update`, `setState` or another state setter: that changes the mirror and not the cell, and skips the consumer's callback. `bazza/no-raw-controlled-state` reports such a write when the receiver looks like a store (`this`, or an identifier or member named `store` or ending in `Store`) and the field is a literal key: `store.set('open', …)`, `store.update({ search })`, `useControlledProp('open', …)`. It doesn't see other receivers (`params.set('search', q)` is fine), computed calls (`store['set'](…)`), destructured methods, keys in variables or computed keys, or objects built elsewhere (`store.update(changes)`). The writes in `changeOpen` and `setSearch`, made with their cell, carry an inline exception; the prop sync writes through computed keys, which the rule doesn't see.

A Surface's settings (`filter`, `normalizeSearch`, `loop`, `autoHighlightFirst`, `clearSearchOnClose`, `resetScrollOnSearch`, `listId`, `inputId`, `onSearchChange`, its listbox context's `virtualization`, and `orderedItems`) reach its store in the commit that renders them, before the List flushes its rows: `SurfaceConfigSync`, the Surface's first child, writes them from layout effects keyed on them (`syncSurfaceSettings(store, settings)` in `store/ListboxStore.ts`, off the published type, and `context.orderedItems`). Never write surface settings into `store.context` from a passive effect: rows would flush, and keys would navigate, with the old ones for a frame. What needs the commit's items registered, which they do in passive effects, stays in the Surface's own passive effects, keyed the same way: re-applying a string `autoHighlightFirst` (`reapplyAutoHighlight`) and highlighting the first of new `orderedItems`.

Rows and items don't reach state when they register. `registerRow` and `registerItem` queue the change, and `flushPendingRegistrations()` publishes the whole batch: one sort of `orderedRows`, one rebuild of the surface's Collection with `filteredItems`, `visibleGroups` and `filteredCount` derived from it, and one auto-highlight check. The list flushes from its layout effect, and a microtask flushes anything left. Between a registration and the flush, those fields are stale. A store method that reads them calls the flush first, as `getVisibleItemIds()`, `selectByShortcut()` and `validateHighlight()` do:

```typescript
getVisibleItemIds(): string[] {
  this.flushPendingRegistrations()
  // ...read state.filteredItems and state.normalizedSearch
}
```

Tests that register directly with the store flush before asserting on state.

The store keeps one Collection of its surface's rows (`#collection`, a `CollectionSnapshot` from `@bazza-ui/menu-core`), filled by one Collection Adapter: the DOM adapter (rows that register), the Virtual adapter (a virtualized list's `virtualItems`) or the Data adapter (a data-first list's rows). Navigation reads its `navOrder` through `getVisibleItemIds()`; never rebuild an order from `context.items`, `virtualItems` or `orderedItems` yourself. Read an item's registration with `getRegistration(store, id)` and a shortcut's item with `getShortcutItemId(store, key)` (functions in `store/ListboxStore.ts`, not store methods), never `context.items` or `context.shortcuts`: a data-first list's rows and a virtualized list's unmounted items aren't in those maps. The list publishes its rows with `publishDataRows(store, …)` from a layout effect that runs after its rows', and its rows (marked by `CollectionRowsContext`) don't register: they `bindDataRow(store, …)` with their element and part props in the commit that renders them, element or not, and a microtask flushes binds the list doesn't publish. Rows that still register (a JSX `Item` next to the data rows, or a `Separator`, `Group`, `Empty` or `Loading` part) go in among them by document position. While a data-first list fills the Collection, the store's state carries a flag (a symbol key, off the published `ListboxState`) that the `isItemVisible` and `isGroupVisible` selectors read: every row and group reads as visible, as the list mounts only the ones it shows. Rows and groups subscribe to those selectors whatever the store's mode; never pick a selector from a value read while rendering, such as `isFilterDisabled()`, which the Surface's settings change later in the commit.

Rows and row-like parts read their state through key selectors, module-level functions in `store/ListboxStore.ts` that take the row's id and return a primitive: `isVisible(id)`, `positionBits(id)`, `containerVisible(cid)` and `hasResults`. Read them with `useStore(store, selector, id)` from `@base-ui/utils/store`, and a row's edges with `useRowPosition(store, id)` (`internal/listbox/hooks/use-row-position.ts`), one bitmask subscription for all six. Don't add them to the store's `selectors` map: its type is published (`typeof selectors`). A part that registers with `registerRow` does so only while it shows (its layout effect keyed on its visibility), so the rows around it take its edges in the commit that hides it.

## Tree membership

Whether a node is part of a menu tree (an outside press, a focus move to an exempt element, which popup claims pointer ownership) is read from the tree's `ElementRegistry` (`@bazza-ui/menu-core`), never from attribute selectors such as `closest('[data-open]')`: another popup on the page carries those too. A part that renders a trigger, positioner, popup, surface or backdrop registers its element with the ref callback `useMenuElement(role)` (`internal/popup-menu/hooks/use-menu-element.ts`; members import it from `members.js`), merged with its other refs. A popup passes the id of the surface it opens with: `useMenuElement('popup', surfaceId)`. Code that checks membership reads the registry with `getElementRegistry(useMenuTree())` (`store/MenuTreeStore.ts`; the registry is a private member of the tree's store). A new part that a press shouldn't count as outside, as the Combobox input doesn't, registers too. A menu root nests its registry in an outer tree's while it's open (`usePopupMenuRoot`), and a popup claims presses on content it portals out (`usePressClaim`, an `onPointerDownCapture` that goes after `{...rest}`), so neither counts as an outside press of the outer tree.

## Layers

`src` is layered, and imports only go down (ADR 0006). From the bottom:

- **`@bazza-ui/menu-core`** (`packages/menu-core`) is below all of `src`: engine code with no React, no Base UI and no import from this package (text matching, event reasons and change details, controlled cells, aim-guard geometry, node def kinds, the menu tree resolver and the data-first pipeline). Any layer of `src` may import it, always as `@bazza-ui/menu-core`. It is private and never published, so it is a devDependency and tsdown bundles it into `dist` (`deps.alwaysBundle` in `tsdown.config.ts`); `bench:dist-imports` fails if `dist` still imports it. When code moves there, its old path in `src` re-exports it, so `internal/popup-menu` and `internal/listbox` export what they did.
- **`src/utils`** imports nothing else in `src`. Code two layers or families share lives here, as the keybinding helpers and `useHotkey` do in `utils/keybinding` (`kbd` re-exports them, and CommandMenu imports `useHotkey` from there).
- **`internal/listbox`** imports `src/utils` only. It never imports `internal/popup-menu`: the event types both need live in `internal/listbox/events.ts`, and `internal/popup-menu/events.ts` re-exports them under the same names.
- **`internal/popup-menu`** imports `src/utils` and `internal/listbox`, deep paths included. Together with `internal/listbox` this is the engine. The engine never imports a member, a loader, `kbd` or `video-player`. When a member needs the engine to behave differently, the engine takes a generic option on its own context and the member sets it: Combobox sets `externalFocus` (focus stays in its input) and `inputEmbedded` (Popup and List render `data-input-embedded`) on `PopupMenuProviders`. Member-only behaviour lives in the member's own part, as `Combobox.Icon` wraps `PopupMenuIcon` to toggle the popup.
- **The members** (`dropdown-menu`, `context-menu`, `command-menu`, `suggestion-menu`, `select`, `combobox`) **and `src/loaders`** import the engine only through `internal/popup-menu/index.js`, `internal/popup-menu/members.js` and `internal/listbox/index.js`. Nothing imports a member or a loader, except the docs entry `docs-types-entry.ts`.

`kbd` and `video-player` are independent families: they import `src/utils` and other families' `index.js` only. Members import a family only through its `index.js` too.

`internal/popup-menu/index.ts` and `internal/listbox/index.ts` are published as `@bazza-ui/react/internal/popup-menu` and `@bazza-ui/react/internal/listbox`, so their exports don't change for a member's convenience. When a member needs an engine name `index.ts` doesn't export, add it to `internal/popup-menu/members.ts`, which isn't a package entry, and import it from `members.js`. The other way past the rule is a member's data-attrs file re-exporting an engine enum, which `bazza/data-attrs-enum` requires to come from the engine's data-attrs file: that line takes an inline exception (see Data Attributes File), as `select/popup/popup.data-attrs.ts` does.

Tests may import any layer, except in `packages/menu-core`, whose tests stay free of React and Base UI too. `no-restricted-imports` checks the rest, with one override per layer in `.oxlintrc.json` (one for `packages/menu-core`, one for all of `src/internal`, and a stricter one for `internal/listbox`). Each override repeats the Base UI patterns from "Lint", because an override's options replace the earlier ones for its files.

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

`bun run lint:exceptions` lists every allowlisted file by rule and every inline exception with its reason. CI runs it and adds the list to the job summary. It fails only on a malformed exception, which catches a bare `/* oxlint-disable */` that has silenced `bazza/disable-needs-reason` itself.

## Bundle size

`bun run bench:size` bundles each menu family entry (`dropdown-menu`, `context-menu`, `command-menu`, `suggestion-menu`, `select`, `combobox`) from `src`, minified with React external and every other dependency bundled, and gzips it. CI runs it on every pull request and fails when an entry's gzip size is over its budget in `bench/size/budgets.json` (bytes).

A budget is the entry's measured gzip size plus 5% headroom. Don't raise one to make CI pass. When growth is intended (a feature that costs bytes), raise it in the same pull request:

1. Run `bun run bench:size` and read the entry's `gzip (B)`.
2. Set its budget to that size × 1.05, rounded up.
3. Say in the pull request description which entries grew, by how much, and why.

Lower a budget the same way when a change shrinks an entry, so the headroom doesn't hide later growth.

While the menu family v4 engine is being rebuilt, CI runs `bench:size` with `BENCH_SIZE_REPORT_ONLY=1`: it still reports every entry and marks those over budget in the job summary, but doesn't fail. Each pull request still says how much each entry grew. Once the rebuild lands, each entry's size is reviewed, budgets are set fresh, and CI fails over budget again. Run without the variable locally to see the check as it will gate.

Because `bench:size` bundles from `src`, it can't see what tsdown leaves out of `dist`. The same CI job builds the package and runs `bun run bench:dist-imports`, which fails when a `dist` file imports a package `@bazza-ui/react` doesn't declare as a dependency or peer dependency, such as a private workspace package tsdown should have bundled.
