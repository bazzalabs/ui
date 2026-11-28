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
- **`className` and `style` resolved before `props`.** Both can be functions of the part's state, and `useRender` only resolves functions passed at the top level of its options, not inside `props` (`bazza/resolve-state-props`). `usePart` (see "Event handlers") renders through `useRender`, so the rule checks its `props` and its `consumer` the same way, and `bazza/part-namespace` reads `state` from it as from `useRender`. The rule has to prove each piece of `props` safe, and reports what it can't:
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

## Event handlers

A part and its consumer can both handle an event: the consumer's `onClick` on an `Item`, and the row's own click handling. The part handler contract (design §6.3, R10) says how the two run. It's implemented once, in `src/utils/use-part.ts`:

- **`usePart(options)`** is `useRender` for such a part. It takes `useRender`'s options, with the part's own element props in `props` and the consumer's (the rest of its props, `className` and `style` taken out) in `consumer`. The part's attributes win, as `{ ...rest, ...ours }` does, and each handler both set is composed. A part reads none of the handlers it composes from its props: they stay in `rest`.
- **`useComposedHandler(consumer, ours)`** composes one handler that goes somewhere else: a hook's (`usePopupMenuKeyboard`'s `onKeyDown`), a Base UI component's, or an engine part's that a member part wraps. It keeps the same function while both halves are the same; name a part's own half `handleOwn<Event>`. `composeHandlers(consumer, ours)` is the same without the memo, for a handler made in render anyway. Composed handlers nest: a member's composed handler, passed to an engine part, is the consumer's there.

The rules today:

1. **The consumer's handler runs first**, then the part's.
2. **`event.preventBaseUIHandler()` in the consumer's handler skips the part's** for that event, as it skips a Base UI component's. It skips the handlers on the element it was called on: the part's, a part's composed over it there (a member part over an engine part), and a Base UI component's the composed handler is passed to (`Dialog.Backdrop`, `Popover.Trigger`). It doesn't skip the handlers of the elements the event bubbles to, whether a part's, a `render` element's merged by Base UI, or a Base UI component's (`Dialog.Popup`): `composeHandlers` makes the flag read `true` only while `event.currentTarget` is the element that set it. That scoping covers the skip called from a handler in a part's own props. A flag set before a part's handler saw the event, by a `render` element's handler or by Base UI itself lower in the tree (`useButton` on Enter, `Checkbox`), behaves as Base UI's: it reaches the Base UI checks on every element above, as it always has, and isn't a skip of a part's handler. The scoped flag is dispatch-scoped: read after the event's dispatch (from a timer or a promise), a skip called from a part's handler reads `false` in `baseUIHandlerPrevented`; a flag Base UI set keeps its value, as it always has.
3. **`event.preventDefault()` keeps the effect each handler has always had.** A part's handler that skips itself for it checks `event.defaultPrevented` first. It skips the part's handler for a row's click and pointer move (every row part, and `SubpageBack`), `SubmenuTrigger`'s pointer move, enter and leave, the keyboard handlers (`usePopupMenuKeyboard`, `useListboxKeyboard`, the Surface's Tab, the Combobox input's keys), the Combobox input's focus, blur and click, `Combobox.Clear` and `Combobox.Icon` clicks, `ContextMenu.Trigger`'s `contextmenu` and `touchstart`, and `CommandMenu.Backdrop`'s `pointerdown` (its documented opt-out). It doesn't skip the Surface's pointer move and focus, the `Input`'s `pointerdown`, `Combobox.Surface`'s pointer move, or `ContextMenu.Trigger`'s touch move, end and cancel. A `pointerdown` never skips the part's press: a CheckboxItem still starts its drag selection when the consumer prevents it (`behaviour-pins.test.tsx`).
4. **A container's key handling skips a key a child already prevented**: the Surface's Tab handling, which runs after the List's and the rows', checks `event.defaultPrevented`.

`internal/popup-menu/part-handler-contract.test.tsx` pins rules 2 and 3 for every handler above, and `utils/use-part.test.tsx` the helpers.

Not under the contract yet (`onX?.(event)` called by hand, with the part's work around it):
- The part's handler runs before the consumer's: a row's `onPointerDown` (its press), the focus-keeping `preventDefault()` on `pointerdown` in `List`, `Surface`, `SubmenuTrigger`, `Combobox.Clear` and `Combobox.Icon`, `Popup`'s pointer enter and move, `ScrollArrow`'s pointer enter and leave, `SubmenuTrigger`'s hover trail, the click a CheckboxItem's drag release fires, which is suppressed before the consumer sees it, the `Input`'s Backspace that goes back a subpage, which returns before the consumer's `onKeyDown` runs, and the popups' `onPointerDownCapture` (`usePressClaim`, in `Popup` and `CommandMenu.Popup`), which claims the press for the tree before calling the consumer's (UI-752).
- Guards that hold whatever the consumer's handler does stay outside the composed handler, as CheckboxItem's click suppression is: a disabled `LinkItem` cancels its click (it never navigates) after the composed handler, so neither a skip nor anything else lets it through.
- Native listeners that run before the consumer's React handler: `DropdownMenu.Trigger`'s and `Select.Trigger`'s capture-phase `pointerdown`, and the document `keydown` listeners that take Escape during a keyboard span or a drag press (UI-753).

A new part, or a new handler on one, composes with `usePart` or `composeHandlers`; don't call the consumer's handler by hand.

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

The menu engine's parts read two contexts, one per tier. Every field of a tier is set when the tier is made and never changes; what changes is read through a store selector. Never write a tier field, or a store's state, while rendering. A tier, store or controller made once gets a consumer's callback (`onOpenChange`) only through one that calls the latest (`useStableCallback` from `@base-ui/utils`), never the first render's function.

- **The tree tier**, `MenuTreeContext`: a `MenuTreeTier` (`internal/popup-menu/contexts/menu-tree-context.ts`) that `PopupMenuProviders` makes with the root's first props. It holds the root's `MenuTreeStore` (`useMenuTree()`), its component name (`useMaybeComponentName()`), its settings, a store whose debug flags are synced from later props with `useSyncedValue` (`usePopupMenuDebug()`), its focus zones (`useMaybeFocusZoneRegistry()`) and its aim guard (an `AimGuardController` from `@bazza-ui/menu-core`, `tier.aimGuard`). The aim guard is the one thing made later: the root's first submenu trigger makes it (`tier.ensureAimGuard(createAimGuard)`, `components/submenu-trigger/create-aim-guard.ts`, on the window's pointer), so a tree with no submenu never builds it and a member with no `SubmenuTrigger` doesn't ship it. It goes into the root's `AimGuardHolder`, which `PopupMenuProviders` keeps for as long as it's mounted and hands every tree tier it makes: a tier made again (a new tree, when the stores a root supplies change, or Fast Refresh) shares the guard its mounted triggers hold, and the providers dispose it only when they unmount. Everything else reads it when it needs it, `null` until then: a popup in its pointer handlers and the listbox rows through `useAimGuardRefs()` (refs that read it when read).
- **The surface tier**, `SurfaceTierContext`: a `MenuSurfaceTier` (`internal/popup-menu/contexts/surface-tier-context.ts`), one per surface store, made where the store is (`PopupMenuProviders`, `SubmenuRoot`, `Subpage`). It holds the submenu (`useSubmenuContext()`; its open state and `closeRootOnEsc` are store state, and every caller in a render gets the same value) and the surface's checkbox selection (a `CheckboxSelectionStore` that binds a `SelectionGestureController` from `@bazza-ui/menu-core`), in a slot store of its own (`tier.selection`, `{ current }`). The surface's first checkbox row makes it, from an effect or a handler, when it changes it (`useCheckboxRowSelection().ensure()`, which calls `ensureCheckboxSelection(tier)` in `components/checkbox-item/checkbox-selection.ts`, which only `CheckboxItem` imports): registering, an anchor, a press, a range. What only reads it (click suppression, an active press, the anchor of a Shift-click) uses `peek()`, so a disabled row never makes it. A surface with no checkbox rows never builds it, and a member with no `CheckboxItem` doesn't ship it. Read it through the slot: `useMaybeCheckboxSelection()` subscribes to it, so the caller renders again once it's made; `useCheckboxSelectionSlot()` subscribes to nothing, for code that reads `slot.state.current` in a handler or an effect; `useCheckboxGestureKind(slot)` renders only when the gesture's kind changes. The Surface's status region (`PopupMenuCheckboxSelectionStatus`) ties the selection to its Surface once it's there: it claims it (`selection.claim(owner)` from a layout effect, with the Surface's owner object), so a new Surface starts it fresh, and the same Surface shown again by `<Activity>` or after Fast Refresh keeps it; it attaches it and gives it the announcement text. The region renders with the Surface's content, so it unmounts while a subpage hides it: the Surface itself, which stays mounted, drops the announcement while it's inactive (reading the slot without subscribing), so the region doesn't announce it again when the Surface comes back. Find the tier a row belongs to by its Surface's store, `findSurfaceTier(tier, store)`: a submenu trigger sits under its submenu's tier.

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

The tree also owns the root's resolver (`tree.resolver`), each data surface's loaders (a Loader Scope, `tree.updateLoaders`, holding the scope's snapshot from the tree's `LoaderManager`, which `tree.loaderManager()` makes when the first loader starts), each popup's data-first state (`tree.updatePopup`, from which `DataPopupProvider` derives `DataPopupContext`) and one tree-wide `version`. A data list registers a grafter for its surface's scope (`tree.setGrafter`), so a loader result is grafted into the resolved tree in the store update that records it, and `version` changes in that update. Loader state has one authority, the `LoaderManager` (`@bazza-ui/menu-core`): every loader adapter reports through `AsyncLoaderResultHandler`, the manager learns the Surface's search from an observer of its store (so the loaders and the rows render the same search, in one commit), runs each loader's debounce on its Clock, and decides each loader's `LoaderState` and whether it settled (`decideSettled`). Never track a loader's progress, its debounce or its settledness in a part's refs or state: read them from the scope. A change the list's resolution makes while rendering (static content, ADR-0002) is published with `tree.publishResolved()` from a layout effect, before paint. Read the resolved tree from the store: a list keys its derived state on its Tree Slice (`useResolution`) together with its coordinator, which changes with every store-time graft of its scope; the root list republishes its popup's slot on `version` too, after every graft, which replaces a slot a consumer set with `setResolvedNodes`; the popup's subpage outlet keys on the `graftVersion` of the slot `DataPopupContext` derives from `version`. Never lift resolved nodes up with React state, and never bump a counter from a passive effect to signal a graft: that renders the graft one commit late.

Whether an open change happens at all is the **close policy**'s: `decideOpenChange` (`@bazza-ui/menu-core`, pure) answers `allow` (with the reason to report), `cancel`, `redirect` to the root, or `back` a subpage, from facts the caller works out (disabled, an exempt target, focus moving to another popup of the tree, an outside press a focus-out came from, `closeRootOnEsc`). It is the one gate for every open and close, and every request goes the same way: the policy, then the consumer's `onOpenChange` (through `changeOpen` and `requestCell`, which a canceled change, or one to a controlled `open`, leaves as it is), then the store. Every request returns what became of it: `noop`, `applied`, `canceled` or `controlled` (the cell's), or `refused` (the policy's). A root's comes from the tree's `ask` (`askRootOpen(store, …)` in `members.js`); a submenu's from `request` on its `SubmenuHandle`, which its trigger's controller reads. Base UI hears what became of a change it started from one rule, `mirrorToBaseUI(result, details)` (`store/MenuTreeStore.ts`, `members.js`): a change that didn't go through (`canceled`, `refused`, or `null` when an adapter kept it from being asked) cancels its details, so Base UI skips its own handling (Escape isn't `preventDefault()`ed); a `noop` and a change taken don't. Every adapter applies it: the roots through `askFromBaseUI(store, open, details)`, the submenu and `Combobox` (whose input can keep a close from being asked) directly. A root's requests go through `handleOpenChange` in `usePopupMenuRoot`, and so do `closeAll`, Base UI's own changes, `ContextMenu`'s open and `Combobox`'s `openCombobox` / `closeCombobox`; a submenu's through `setOpen` or `request` on its `SubmenuHandle` (the submenu context's `setOpen(open, reason, event)`), whose store tells the consumer, so a controlled submenu opens on hover; Escape in a submenu or subpage is decided in `useListboxKeyboard`. Pass the reason where the change starts. Don't add a disabled check, an exemption, or Escape routing of your own; give the policy the fact and apply its decision. Whatever closes the root (a request, Base UI's dismissal, a controlled `open` going false), its open submenus close, and the tree's focus owner and open chain clear, when the root store's `open` goes false, with the cause of the close: a close the consumer canceled, or hasn't applied yet, leaves them as they are. Each submenu closes its own submenus the same way, with its cause. The cause is the open cell's request's (`changeOpen` records it before the consumer runs, so a `flushSync` inside it reads it, and a canceled change leaves the cell as it was; `getCloseCause` reads it from an observer of `open`). It lasts until it's superseded, by the next request on the store or the next prop sync, with no timer, so a controlled `open` set in a later task still closes them with it. These observers, and the submenus' registrations, are layout effects, so a close a layout effect makes reaches them. When a submenu that owns focus closes, a key that closed only it (ArrowLeft, Ctrl+H, Escape: cause `list-navigation` or `escape-key`) hands focus back to its parent's surface, if that's still open and focus hasn't moved outside the tree, and suppresses auto-reopen while its trigger stays highlighted; any other close only drops its ownership. The keys only ask, so the hooks never move focus themselves. A closed surface (kept mounted, or exiting) never auto-focuses. A close the engine makes (`closeAll`, a Combobox closing itself, Select's resize close) goes through while the menu is disabled; a disabled menu cancels opens and Base UI's own Escape, outside-press and focus-out dismissals. A submenu leaves a dismissal from outside the tree's popups to its root only when the root hears it too (an outside press, or the focus-out one causes in the same task, `outsidePressThisTask` on the tree's `ElementRegistry`).

Only the store that owns a cell writes it and its mirrors, in one update, in three places:

- `setOpen` calls `changeOpen` (`internal/listbox/store/ListboxStore.ts`, shared by `ListboxStore` and `MenuTreeStore`), which calls `requestCell` (`@bazza-ui/menu-core`): unless the request is a `noop`, the consumer's `onOpenChange` runs first, and a canceled change, or one to a controlled value, leaves the value as it is. Each change has one record, the cell's `request` (`OpenRequest`: its value, the task it was asked in (`currentTask()`), its event, its reason and, for a close, its cause), with one lifecycle: the cell takes it before the consumer runs, keeps it while a controlled change is pending, until the next prop sync (`controlOpenCell`, which lets the prop's observers read it first, and records the request's `openMethod` when the prop applies an open it asked for) or the next request, and drops it once an uncontrolled change is written; no timer. `getRequestReason` and `getCloseCause` read it. The same change asked again in its task or with its event (a user event's listeners can each run in a task of their own), or from inside the consumer's callback, is a `noop`; a change away from it (a reversal before the prop arrives) still reaches the consumer; a change the consumer superseded from inside its callback reads as what the cell says of it afterwards. The store is the only authority for open: nothing outside it assumes a change happened.
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

Rows and row-like parts read their state through key selectors, module-level functions in `store/ListboxStore.ts` that take the row's id and return a primitive: `isVisible(id)`, `positionBits(id)`, `containerVisible(cid)`, `hasResults`, and a checkbox row's `isPending(id)`. Read them with `useStore(store, selector, id)` from `@base-ui/utils/store`, and a row's edges with `useRowPosition(store, id)` (`internal/listbox/hooks/use-row-position.ts`), one bitmask subscription for all six. Don't add them to the store's `selectors` map: its type is published (`typeof selectors`). A checkbox or radio group's value lives in a store: a `CheckboxGroup` or `CheckboxGroupValue` makes a `CheckboxGroupStore`, a `RadioGroup` or `RadioGroupValue` a `RadioGroupStore` (`internal/popup-menu/store/`), with the group's cell, and puts it in `CheckboxGroupContext` or `RadioGroupContext`. The store's state is the group's own value (the one it keeps while no prop controls it): rows of an uncontrolled group read `isChecked(value)` or `isSelected(value)` from it, so a change re-renders only the rows it checks or unchecks (for radio, the item that loses the selection and the one that takes it). A controlled group's rows read the prop instead, from the context's `controlledValue`, so the context changes with a controlled value and every row re-renders, as before the group had a store: a row rendered by the same parent as the group gets the new value in that render, and no row ever renders a value older than its props. Don't move a controlled value to the store to save those renders: the store learns the prop only after the render (`useGroupValueStore` syncs it from a layout effect, for the events that read `getValue()`), and writing it while rendering is forbidden. Both stores are a `GroupValueStore` (`store/GroupValueStore.ts`), which keeps the cell and is its only writer. It tells the consumer of every change, as the group's own state did: the cell changes through `notifyCell` (`@bazza-ui/menu-core`), not `requestCell`, which would skip a change it has seen in the task, and a change writes only over the cell it was asked of, so what the consumer did from inside its callback (a prop synced with `flushSync`, another change) stands. A headless `*GroupValue` keeps no value of its own (`ownsValue: false`): while its `value` is `undefined`, a press only reports. A standalone `CheckboxItem` keeps its own state (`useState` and its `checked` prop): it's the only row that reads it, so a store would save no render.

A part that registers with `registerRow` does so only while it shows (its layout effect keyed on its visibility), so the rows around it take its edges in the commit that hides it.

## Tree membership

Whether a node is part of a menu tree (an outside press, a focus move to an exempt element, which popup claims pointer ownership) is read from the tree's `ElementRegistry` (`@bazza-ui/menu-core`), never from attribute selectors such as `closest('[data-open]')`: another popup on the page carries those too. A part that renders a trigger, positioner, popup, surface or backdrop registers its element with the ref callback `useMenuElement(role)` (`internal/popup-menu/hooks/use-menu-element.ts`; members import it from `members.js`), merged with its other refs. A popup passes the id of the surface it opens with: `useMenuElement('popup', surfaceId)`. Code that checks membership reads the registry with `getElementRegistry(useMenuTree())` (`store/MenuTreeStore.ts`; the registry is a private member of the tree's store). A new part that a press shouldn't count as outside, as the Combobox input doesn't, registers too. A menu root nests its registry in an outer tree's while it's open (`usePopupMenuRoot`), and a popup claims presses on content it portals out (`usePressClaim`, an `onPointerDownCapture` that goes after `{...rest}`), so neither counts as an outside press of the outer tree.

## Popup presence

Base UI owns a popup's presence until our own popup layer replaces it (UI-699): `Popover.Root` and `Dialog.Root` mount the popup, set `data-starting-style` and `data-ending-style`, keep it mounted while its exit animations run, then unmount it and report `onOpenChangeComplete(false)`. With nothing to animate, Base UI still waits a frame first, so the closed popup paints once. `useCloseInOneFrame(store, depth)` (`internal/popup-menu/hooks/use-close-in-one-frame.ts`) returns a ref callback that `PopupMenuPopup` and `CommandMenu.Popup` merge into the popup's ref, so it follows the element as it changes (a `render` element swapped while the popup is mounted). It completes a keyboard or programmatic close (Escape, an item press, `open` set to false) in the frame it closes (design §6.2):

- It acts as Base UI's close starts: when `data-ending-style` lands on the popup, which Base UI adds in a commit synced from its root's layout effect. A `MutationObserver` on the attribute hears it in a microtask after React's commits, before the browser paints, so the popup part doesn't subscribe to `open` or render for it.
- The completions queued in that checkpoint run in one microtask, the deepest popup first (`depth`): a root's unmount unmounts its submenus, which would then never report their own close, so a submenu closing with its root completes before it, and every popup reports its close once.
- It does so only when that batch is every close in the document: one menu tree's popups (by its `ElementRegistry`), with no element carrying `data-ending-style` (Base UI's marker, ours or not) but them and the tree's registered backdrops. A popup's unmount unmounts what it holds, and only depth orders popups, within one tree. A popup of another tree, or a Base UI `Popover`, `Dialog` or `Tooltip`, closing in the same commit leaves the whole batch to Base UI, which completes inner popups first, a frame later. Of two at one depth, the one queued later completes first.
- A completion that throws doesn't stop the batch: the rest complete, and the error is reported after (`reportError`, or thrown from a microtask).
- If the popup's own `getAnimations()` (the element's, as Base UI waits on, not its subtree's) lists no running animation, it asks the level's Base UI root to unmount it now, in `flushSync`. `getAnimations()` brings styles up to date first, so the exit `[data-ending-style]` starts is already listed.
- A close a press made on `pointerdown` (an outside press, a `CommandMenu.Backdrop`, a consumer's own `onPointerDown`: any close whose cause, or the event being dispatched as `open` goes false, is a `pointerdown`, `mousedown` or `touchstart`, or whose reason is `outside-press`) stays Base UI's, a frame later: the press's `mousedown` moves focus after the close, in the same task, and the focus manager returns focus as the popup unmounts, which has to come after that. Completing in a next task (`setTimeout(0)`, a `MessageChannel`) costs that same frame in Chromium, whose input tasks run at the start of a frame. The cause is read from an observer of the store's `open`, as the close is written (`getCloseCause`).
- It unmounts only while Base UI's close is pending: the popup has `data-ending-style`, its store is still closed, and Base UI doesn't complete closes at once itself (it does with no `getAnimations()`, as in jsdom, or with `BASE_UI_ANIMATIONS_DISABLED`). Base UI's `unmount` reports the close each time it's called.
- It reaches that root through `popupActionsOf(store)` (`internal/listbox/store/ListboxStore.ts`): a ref the store makes with itself, a private field read through that accessor, so `ListboxStore`'s published type doesn't change. Every member root and `SubmenuRoot` passes it as its `Popover.Root` or `Dialog.Root` `actionsRef`, and the consumer's `actionsRef` (`close`, `unmount`) goes through the same ref. A new root or popup part passes and reads it the same way.

A popup with an exit animation keeps completing when Base UI sees it finish. Base UI only ever keeps a closed popup mounted at a request (`preventUnmountOnClose` on its event details), which never reaches a consumer: the roots hand consumers our own event details.

## Layers

`src` is layered, and imports only go down (ADR 0006). From the bottom:

- **`@bazza-ui/menu-core`** (`packages/menu-core`) is below all of `src`: engine code with no React, no Base UI and no import from this package (text matching, event reasons and change details, controlled cells, aim-guard geometry, node def kinds, the menu tree resolver, the data-first pipeline, and controllers with the clock they run on). Any layer of `src` may import it, always as `@bazza-ui/menu-core`. It is private and never published, so it is a devDependency and tsdown bundles it into `dist` (`deps.alwaysBundle` in `tsdown.config.ts`); `bench:dist-imports` fails if `dist` still imports it. When code moves there, its old path in `src` re-exports it, so `internal/popup-menu` and `internal/listbox` export what they did.
- **`src/utils`** imports nothing else in `src`. Code two layers or families share lives here, as the keybinding helpers and `useHotkey` do in `utils/keybinding` (`kbd` re-exports them, and CommandMenu imports `useHotkey` from there).
- **`internal/listbox`** imports `src/utils` only. It never imports `internal/popup-menu`: the event types both need live in `internal/listbox/events.ts`, and `internal/popup-menu/events.ts` re-exports them under the same names.
- **`internal/popup-menu`** imports `src/utils` and `internal/listbox`, deep paths included. Together with `internal/listbox` this is the engine. The engine never imports a member, a loader, `kbd` or `video-player`. When a member needs the engine to behave differently, the engine takes a generic option on its own context and the member sets it: Combobox sets `externalFocus` (focus stays in its input) and `inputEmbedded` (Popup and List render `data-input-embedded`) on `PopupMenuProviders`. Member-only behaviour lives in the member's own part, as `Combobox.Icon` wraps `PopupMenuIcon` to toggle the popup.
- **The members** (`dropdown-menu`, `context-menu`, `command-menu`, `suggestion-menu`, `select`, `combobox`) **and `src/loaders`** import the engine only through `internal/popup-menu/index.js`, `internal/popup-menu/members.js` and `internal/listbox/index.js`. Nothing imports a member or a loader, except the docs entry `docs-types-entry.ts`.

`kbd` and `video-player` are independent families: they import `src/utils` and other families' `index.js` only. Members import a family only through its `index.js` too.

`internal/popup-menu/index.ts` and `internal/listbox/index.ts` are published as `@bazza-ui/react/internal/popup-menu` and `@bazza-ui/react/internal/listbox`, so their exports don't change for a member's convenience. When a member needs an engine name `index.ts` doesn't export, add it to `internal/popup-menu/members.ts`, which isn't a package entry, and import it from `members.js`. The other way past the rule is a member's data-attrs file re-exporting an engine enum, which `bazza/data-attrs-enum` requires to come from the engine's data-attrs file: that line takes an inline exception (see Data Attributes File), as `select/popup/popup.data-attrs.ts` does.

Timing and the state machine behind an interaction live in a **controller** in `packages/menu-core/src/controllers/`, not in a part's refs and effects. A controller takes its options (a `Clock` from `platform/clock.ts` for its timers, and plain callbacks for what it decides, which return what became of a decision a store or a consumer can refuse, as a request result, never whether the value changed: the store reports that itself, as an event), takes events with `send(event)`, and exposes `getSnapshot()`, `subscribe(listener)` (told once per event or timer that changes the state) and `dispose()`. It never calls `setTimeout` itself, so its tests run it on `createFakeClock()`. It keeps interaction intent only (what it asked for and is waiting on, a gesture's refusal, a key's wish to move focus once a submenu opens, a suppression an explicit close sets); the value an interaction changes is the store's, which it learns from events (`SubmenuController`'s `open.change`, which its binding sends from an observer of the submenu store's `open`), and what other parts decide reaches it as an event too (`close.explicit`), never through a ref they write. The part is a thin binding: it makes the controller once, sends it the DOM events and store changes it needs, and applies its decisions, as `PopupMenuSubmenuTrigger` does with `SubmenuController` (`components/submenu-trigger/use-submenu-controller.ts`). What needs the DOM (rects, window listeners) reaches the controller through an interface it takes: the tree's `AimGuardController` listens to the pointer through `AimGuardPointer`, only while a trail or an exit is held, and reads rects through the getters each `AimGuardTrigger` is made with (`use-submenu-aim-guard.ts`). A debug overlay a controller can draw is worked out only while the part subscribes to it (`subscribeDebug`), so it costs nothing while the debug flag is off. Debug tooling ships in development builds only: the overlay's logic lives in a module of its own that the controller takes as an option (`AimGuardControllerOptions.overlay`, `createAimGuardOverlay`), and its log calls, trace strings and the React overlay sit behind `process.env.NODE_ENV !== 'production'`, so a production bundle drops them. Keep new debug code the same way: in a module production code doesn't import, or behind that check, never as methods of a class production code uses (a bundler can't drop a class's unused methods). Geometry the controllers take is structural (`Rect` from `@bazza-ui/menu-core`, which a `DOMRect` satisfies), never a DOM type.

`menu-core` has two kinds of primitive: pure **policy functions**, which decide from the facts they're given and keep no state (`decideOpenChange`), and stateful **controllers**. A controller never takes a mutable ref that other code writes: what it needs to know reaches it as an event or an option it reads. A controller whose job is naturally imperative takes commands as methods instead of `send(event)`, still on an injected `Clock`, with `subscribe` and `dispose`: the `AimGuardController` (`trigger()`, `pointerInPopup`) the tree's `LoaderManager` (`start`, `setSearch`, `report`, `withdraw`, `remove`, `drop`, read with `get`, `scope` and `isTreeSettled`), and each surface's `SelectionGestureController` (`beginGesture`, `extendGesture`, `commitGesture`, `applyRange`, `beginPress`, `movePress`, `endPress`, `cancelPress`). The selection controller spans the surface's navigation order (`getVisibleItemIds()`), reads layout and scrolls through a `SelectionGestureLayout` its binding supplies, and runs its click suppression and auto-scroll frames on its clock; its binding (`CheckboxSelectionStore`) owns the press's document listeners and pointer capture (`SelectionPressBinding`), and mirrors its snapshot (the anchor, the gesture and the announcement) as the store's state. The preview is the set of rows the gesture would change, which the controller writes to the surface's `ListboxStore` through the `SelectionPreview` its binding supplies (`setPendingRows`); a row reads it with the `isPending(id)` key selector and shows the opposite of its committed state while it's pending. A menu tree has no teardown, so the tree never disposes its `LoaderManager`: each loader's binding removes it (ending its debounce) and each Surface drops its scope when it unmounts, which leaves the manager no timers.

A React binding that bridges timing, controlled state under non-discrete events (a hover, an aim), exit animations, focus return or outside-press dismissal gets a `*.browser.test.tsx` beside its jsdom tests: jsdom doesn't lay out, animate or move focus the way a browser does.

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

## Module side effects

`package.json` declares `"sideEffects": false` (as `@bazza-ui/menu-core` does, whose code ships inside `dist`), so a bundler (`bench:size`, tsdown, a consumer's app) drops every module a member never reaches through an import whose bindings it uses: in `bench:size`, Select ships no submenu or checkbox parts because it never imports them. (`dist` keeps the engine in one shared chunk, which an app's bundler keeps whole.) That's only safe while importing a module does nothing outside it. At its top level a module in `packages/react/src` or `packages/menu-core/src` may only:

- import with bindings (never a bare `import './x'`, a dynamic `import()` or a top-level `await`) and export;
- declare functions, classes, types, interfaces, enums and namespaces, whose code that runs on definition (a superclass, computed keys, static members and blocks, enum values, a namespace's body) follows these rules too, with no decorators;
- initialize variables with values built by known-pure calls only (React's component and context factories, Base UI's store primitives, and a few built-ins that build a fresh value); destructuring defaults and computed keys count as initializers. `PURE_CALLS` in `tooling/lint/rules/no-module-side-effects.mjs` is the one list of them;
- write a direct property of an object it owns: a function, class or enum it declares, or a `const` it initializes with a fresh literal, a function or a pure call (`Tooltip.Popup = TooltipPopup`, `Context.displayName = …`). A class static block may also set the module's own `let` bindings. A `const` that aliases an import or a global (`const Portal = Dialog.Portal`) isn't owned: writing to it writes another module's object. Nor is an ambient (`declare`) declaration, a class with a superclass, or an object literal with a setter, and a write to a class's static setter isn't own. Inside a dev-only block or a namespace body, a name means that scope's own declaration first. All of this also inside `if (process.env.NODE_ENV !== 'production') { … }`.

Anything else (a registration, a listener, a global or an imported object written, a polyfill, a CSS import) would run in some apps and not others. Put it in a function the code that needs it calls. `bazza/no-module-side-effects` checks this in the shipped source of both packages (tests, type tests, `__tests__` and `test-helpers` files are exempt), and its message names what it found. A new pure call an initializer needs goes in `PURE_CALLS`; anything that must run on import takes a reasoned `oxlint-disable-next-line` and an entry in the `sideEffects` array instead of `false`.

## Bundle size

`bun run bench:size` bundles each menu family entry (`dropdown-menu`, `context-menu`, `command-menu`, `suggestion-menu`, `select`, `combobox`) from `src`, minified with React external and every other dependency bundled, and gzips it. CI runs it on every pull request and fails when an entry's gzip size is over its budget in `bench/size/budgets.json` (bytes).

A budget is the entry's measured gzip size plus 5% headroom. Don't raise one to make CI pass. When growth is intended (a feature that costs bytes), raise it in the same pull request:

1. Run `bun run bench:size` and read the entry's `gzip (B)`.
2. Set its budget to that size × 1.05, rounded up.
3. Say in the pull request description which entries grew, by how much, and why.

Lower a budget the same way when a change shrinks an entry, so the headroom doesn't hide later growth.

While the menu family v4 engine is being rebuilt, CI runs `bench:size` with `BENCH_SIZE_REPORT_ONLY=1`: it still reports every entry and marks those over budget in the job summary, but doesn't fail. Each pull request still says how much each entry grew. Once the rebuild lands, each entry's size is reviewed, budgets are set fresh, and CI fails over budget again. Run without the variable locally to see the check as it will gate.

Because `bench:size` bundles from `src`, it can't see what tsdown leaves out of `dist`. The same CI job builds the package and runs `bun run bench:dist-imports`, which fails when a `dist` file imports a package `@bazza-ui/react` doesn't declare as a dependency or peer dependency, such as a private workspace package tsdown should have bundled.
