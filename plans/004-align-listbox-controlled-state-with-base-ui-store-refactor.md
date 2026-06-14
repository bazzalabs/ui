# 004 — Align `ListboxStore` Controlled State With Base UI Store Refactor

> **Type:** Follow-up architecture plan ·
> **Effort:** M ·
> **Risk:** Medium (controlled/uncontrolled state semantics) ·
> **Depends on:** `003-bump-base-ui-react-to-1.5.0.md` DONE ·
> **Planned against commit:** `07aee02d` plus the reviewed working-tree diff from plan 003.

This plan is **self-contained**. You (the executor) have no context from the authoring
session. Read it fully before editing. Package manager is **bun only** — never
npm/yarn/pnpm/npx. Do not run `bun run dev`.

---

## 1. Goal

Replace the temporary compatibility migration from plan 003 with the architecture Base UI
intended when `@base-ui/utils` changed `ReactStore.useControlledProp` from 3 arguments to
2 arguments.

In short: controlled props should be stored in separate `*Prop` state fields and selectors
should resolve `controlledProp ?? internalState`. Defaults should be applied during store
initialization, not through a component-local shim.

This plan removes the `defaultSearchInitializedStores` `WeakSet` shim introduced by plan
003 and updates `ListboxStore` so `open` and `search` follow the same controlled-state
pattern Base UI uses internally.

---

## 2. Why This Matters

Plan 003 got `@base-ui/react@1.5.0` passing with a minimal compatibility migration:

```ts
store.useControlledProp('open', openProp)
store.useControlledProp('search', searchProp)
```

and a temporary `WeakSet` in `PopupMenuSurface` to keep `defaultSearch` working across
Surface unmount/remount:

```ts
const defaultSearchInitializedStores = new WeakSet<object>()
```

That works, but it does not fully match the upstream Base UI store refactor. The upstream
motivation for the 2-arg `useControlledProp` API is:

- defaults are seeded into initial store state;
- controlled props are stored separately (for example `openProp`);
- selectors merge the external controlled prop with the internal state (for example
  `state.openProp ?? state.open`);
- internal writes continue to target the internal field (`open`, `search`) without needing
  `ReactStore` to block writes to controlled keys.

This separation makes controlled/uncontrolled semantics explicit in this package's own
store rather than relying on removed Base UI utility behavior.

---

## 3. Current State Excerpts

### 3.1 `ListboxState` currently has only internal state fields

File: `packages/react/src/internal/listbox/store/ListboxStore.ts`

Current shape:

```ts
export interface ListboxState {
  /** Whether the listbox is open */
  open: boolean
  /** Current search query */
  search: string
  /** Normalized search query used for filtering and visibility checks */
  normalizedSearch: string
  // ...
}
```

Current selectors:

```ts
const selectors = {
  open: createSelector((state: ListboxState) => state.open),
  search: createSelector((state: ListboxState) => state.search),
  normalizedSearch: createSelector(
    (state: ListboxState) => state.normalizedSearch,
  ),
  // ...
}
```

### 3.2 Plan 003 left `useControlledProp` calls syncing into the internal fields

Examples:

```ts
store.useControlledProp('open', openProp)
store.useControlledProp('search', searchProp)
```

Call sites:

- `packages/react/src/dropdown-menu/root/root.tsx`
- `packages/react/src/context-menu/root/root.tsx`
- `packages/react/src/select/root/root.tsx`
- `packages/react/src/combobox/root/root.tsx`
- `packages/react/src/internal/popup-menu/components/submenu-root/submenu-root.tsx`
- `packages/react/src/internal/popup-menu/components/surface/surface.tsx`

### 3.3 Plan 003 added a temporary `defaultSearch` shim

File: `packages/react/src/internal/popup-menu/components/surface/surface.tsx`

Current shape:

```ts
const defaultSearchInitializedStores = new WeakSet<object>()

// inside PopupMenuSurface after useListboxContext()
if (!defaultSearchInitializedStores.has(store)) {
  defaultSearchInitializedStores.add(store)
  if (searchProp === undefined && defaultSearch !== store.state.search) {
    store.setSearch(defaultSearch)
  }
}
```

This must be removed by this plan.

---

## 4. Desired Architecture

### 4.1 Add controlled-prop state fields

Update `ListboxState`:

```ts
export interface ListboxState {
  /** Whether the listbox is open internally when uncontrolled */
  open: boolean
  /** Controlled open prop. When defined, selectors resolve this over `open`. */
  openProp: boolean | undefined

  /** Current internal search query when uncontrolled */
  search: string
  /** Controlled search prop. When defined, selectors resolve this over `search`. */
  searchProp: string | undefined

  /** Normalized search query used for filtering and visibility checks */
  normalizedSearch: string
  // ...
}
```

Update `createInitialState()` to include:

```ts
openProp: undefined,
searchProp: undefined,
```

### 4.2 Selectors resolve controlled values first

Update selectors:

```ts
open: createSelector((state: ListboxState) => state.openProp ?? state.open),
search: createSelector((state: ListboxState) => state.searchProp ?? state.search),
normalizedSearch: createSelector((state: ListboxState) => {
  const search = state.searchProp ?? state.search
  // See Step 1.3 for normalizedSearch handling.
  return state.normalizedSearch
}),
```

The `normalizedSearch` selector itself may remain `state.normalizedSearch`; the important
part is that all code which updates normalized search responds to the effective search
value (`searchProp ?? search`). Prefer the smallest correct change that makes tests pass.

### 4.3 `useControlledProp` syncs `*Prop` fields

Change call sites from:

```ts
store.useControlledProp('open', openProp)
store.useControlledProp('search', searchProp)
```

to:

```ts
store.useControlledProp('openProp', openProp)
store.useControlledProp('searchProp', searchProp)
```

Internal writes still target `open` and `search` through existing methods like
`store.setOpen(...)` and `store.setSearch(...)`.

### 4.4 Defaults move to initialization

`defaultOpen` is already initialized correctly:

```ts
ListboxStore.useStore(undefined, { open: defaultOpen }, ...)
```

`defaultSearch` currently exists only on `PopupMenuSurface`, so move that value into store
initialization by adding a focused API to `ListboxStore`:

```ts
initializeDefaultSearch(defaultSearch: string): void
```

That method should initialize once per store instance, before controlled `searchProp` sync,
and should set both `search` and `normalizedSearch` through `setSearch(defaultSearch)` when:

- no controlled `searchProp` is defined;
- default search has not already been initialized for this store;
- `defaultSearch !== this.state.search`.

Use a private instance field in `ListboxStore`, not a module-level `WeakSet` in `Surface`:

```ts
private defaultSearchInitialized = false
```

This keeps the initialization responsibility with the store, where upstream Base UI moved
it conceptually.

---

## 5. Files In Scope

Only these files are in scope:

1. `packages/react/src/internal/listbox/store/ListboxStore.ts`
2. `packages/react/src/internal/listbox/store/ListboxStore.test.ts`
3. `packages/react/src/dropdown-menu/root/root.tsx`
4. `packages/react/src/context-menu/root/root.tsx`
5. `packages/react/src/select/root/root.tsx`
6. `packages/react/src/combobox/root/root.tsx`
7. `packages/react/src/internal/popup-menu/components/submenu-root/submenu-root.tsx`
8. `packages/react/src/internal/popup-menu/components/surface/surface.tsx`
9. Existing component tests only if needed to update/add assertions around controlled state:
   - `packages/react/src/dropdown-menu/root/root.test.tsx`
   - `packages/react/src/context-menu/root/root.test.tsx`
   - `packages/react/src/select/root/root.test.tsx`
   - `packages/react/src/combobox/root/root.test.tsx`
   - `packages/react/src/internal/popup-menu/popup-menu.test.tsx`

Do **not** touch dependency versions, `bun.lock`, generated registry files, build outputs,
or unrelated components.

---

## 6. Implementation Steps

### Step 0 — Pre-flight / drift check

Run:

```sh
cd /Users/kianbazza/repos/bazzalabs/ui
grep -n '"@base-ui/react"' packages/react/package.json
grep -n '"@base-ui/utils"' packages/react/package.json
rg -n "defaultSearchInitializedStores|useControlledProp\(" packages/react/src
```

Expected before starting this plan:

```txt
"@base-ui/react": "1.5.0"
"@base-ui/utils": "0.2.9"
packages/react/src/internal/popup-menu/components/surface/surface.tsx:<line>:const defaultSearchInitializedStores = new WeakSet<object>()
```

There should be six `useControlledProp(...)` calls from plan 003.

> STOP if plan 003 is not already applied or if `@base-ui/utils` is not `0.2.9`; this plan
> assumes the new 2-argument `useControlledProp` API.

### Step 1 — Extend `ListboxState`

In `ListboxStore.ts`:

1. Add `openProp: boolean | undefined` after `open`.
2. Add `searchProp: string | undefined` after `search`.
3. Add both fields to `createInitialState()` with `undefined`.

Keep the internal `open` and `search` fields; do not rename them.

### Step 2 — Update selectors for effective state

In `ListboxStore.ts`, change selectors:

```ts
open: createSelector((state: ListboxState) => state.openProp ?? state.open),
search: createSelector((state: ListboxState) => state.searchProp ?? state.search),
```

Then audit every selector and method in `ListboxStore.ts` that reads `state.search` or
`state.open` directly. Do not blindly replace all reads. Use this rule:

- Reads that represent the externally observed value should use the effective selector or
  effective helper (`searchProp ?? search`, `openProp ?? open`).
- Writes should keep targeting internal `open` / `search`.
- Filtering and normalized search should be based on the effective search.

Recommended small helper methods inside `ListboxStore`:

```ts
private getEffectiveSearch() {
  return this.state.searchProp ?? this.state.search
}

private getEffectiveOpen() {
  return this.state.openProp ?? this.state.open
}
```

Use these only where they reduce repeated logic. Do not over-refactor.

### Step 3 — Keep `normalizedSearch` synced with effective search

Currently the constructor observes `search`:

```ts
this.observe('search', (search, prevSearch) => {
  if (search === prevSearch) return
  const normalizedSearch = this.context.normalizeSearch(search)
  if (normalizedSearch !== this.state.normalizedSearch) {
    this.set('normalizedSearch', normalizedSearch)
  }
})
```

After adding `searchProp`, this must also react when the controlled search prop changes.
Choose the minimal robust implementation:

- Either observe both `search` and `searchProp` and call one shared sync method.
- Or add a selector/effect path that recomputes normalized search whenever effective search
  changes.

Recommended implementation inside `ListboxStore`:

```ts
private syncNormalizedSearch() {
  const search = this.state.searchProp ?? this.state.search
  const normalizedSearch = this.context.normalizeSearch(search)
  if (normalizedSearch !== this.state.normalizedSearch) {
    this.set('normalizedSearch', normalizedSearch)
  }
}
```

Then in the constructor:

```ts
this.observe('search', (search, prevSearch) => {
  if (search !== prevSearch) this.syncNormalizedSearch()
})

this.observe('searchProp', (searchProp, prevSearchProp) => {
  if (searchProp !== prevSearchProp) this.syncNormalizedSearch()
})
```

If TypeScript complains that `observe('searchProp', ...)` is unavailable, update the
selectors object to include `searchProp: createSelector((state) => state.searchProp)`.
Similarly, if you need to observe `openProp`, add an `openProp` selector.

### Step 4 — Add store-owned default search initialization

In `ListboxStore`, add:

```ts
private defaultSearchInitialized = false

initializeDefaultSearch(defaultSearch: string) {
  if (this.defaultSearchInitialized) return
  this.defaultSearchInitialized = true

  if (this.state.searchProp === undefined && defaultSearch !== this.state.search) {
    this.setSearch(defaultSearch)
  }
}
```

This replaces the module-level `WeakSet` shim in `surface.tsx`.

### Step 5 — Update controlled-prop call sites

Change five open call sites:

```diff
-  store.useControlledProp('open', openProp)
+  store.useControlledProp('openProp', openProp)
```

Files:

- `packages/react/src/dropdown-menu/root/root.tsx`
- `packages/react/src/context-menu/root/root.tsx`
- `packages/react/src/select/root/root.tsx`
- `packages/react/src/combobox/root/root.tsx`
- `packages/react/src/internal/popup-menu/components/submenu-root/submenu-root.tsx`

Change the search call site in `surface.tsx`:

```diff
-  store.useControlledProp('search', searchProp)
+  store.useControlledProp('searchProp', searchProp)
```

Before that call, replace the `WeakSet` block with:

```ts
store.initializeDefaultSearch(defaultSearch)
```

Remove:

```ts
const defaultSearchInitializedStores = new WeakSet<object>()
```

### Step 6 — Tests

Add or update tests before relying on the full suite.

#### 6.1 Store unit tests

File: `packages/react/src/internal/listbox/store/ListboxStore.test.ts`

Add focused tests covering:

1. `useControlledProp('openProp', true)` makes `store.useState('open')`/selector-backed
   reads resolve true without overwriting `state.open`.
2. `setOpen(false)` updates internal `state.open` but effective open remains true while
   `openProp` is true.
3. `useControlledProp('searchProp', 'apple')` makes effective `search` and
   `normalizedSearch` reflect `'apple'`.
4. `setSearch('banana')` updates internal `state.search` but effective search remains
   `'apple'` while `searchProp` is controlled.
5. `initializeDefaultSearch('x')` runs once per store and does not reset search after it has
   changed.

Use existing `ListboxStore.test.ts` patterns. Do not introduce a new test framework.

If directly invoking `useControlledProp` from a store-unit test is awkward because it is a
React hook-style method, prefer component integration tests from 6.2 and add store tests only
for non-hook methods like `initializeDefaultSearch` and selector behavior.

#### 6.2 Existing component tests must stay green

These existing tests are especially relevant and should not be weakened:

- `packages/react/src/internal/popup-menu/deep-search/__tests__/data-list.test.tsx`
  - forced sorting test with `defaultSearch="x"`
- `packages/react/src/internal/popup-menu/popup-menu.test.tsx`
  - `clearSearchOnClose` tests, especially `preserves search when clearSearchOnClose is false`
- root controlled/default open tests in dropdown/context/select/combobox suites

Only add assertions if needed to prove controlled behavior. Do not delete or loosen existing
assertions.

---

## 7. Verification Gates

Run from repo root:

```sh
bun run type-check
bun run test
bun run build
bun run check
```

Expected:

- `bun run type-check`: exit 0.
- `bun run test`: all tests pass.
- `bun run build`: exit 0.
- `bun run check`: exit 0; existing warnings may be reported, but no fixes should be
  applied.

Useful targeted loop while developing:

```sh
cd packages/react
bun run test src/internal/listbox/store/ListboxStore.test.ts
bun run test src/internal/popup-menu/popup-menu.test.tsx
bun run test src/internal/popup-menu/deep-search/__tests__/data-list.test.tsx
bun run type-check
```

---

## 8. Done Criteria

- [ ] `ListboxState` has `openProp` and `searchProp` fields.
- [ ] `selectors.open` resolves `state.openProp ?? state.open`.
- [ ] `selectors.search` resolves `state.searchProp ?? state.search`.
- [ ] `normalizedSearch` is kept in sync with effective search, including controlled
      `searchProp` changes.
- [ ] Five root/submenu call sites use `store.useControlledProp('openProp', openProp)`.
- [ ] `PopupMenuSurface` uses `store.useControlledProp('searchProp', searchProp)`.
- [ ] `defaultSearchInitializedStores` no longer exists.
- [ ] `ListboxStore` owns one-time `defaultSearch` initialization.
- [ ] Relevant tests cover controlled prop separation and `defaultSearch` persistence.
- [ ] `bun run type-check`, `bun run test`, `bun run build`, and `bun run check` pass.

---

## 9. STOP Conditions

Stop and report instead of improvising if:

- You find that plan 003 has not landed or the repo is not on `@base-ui/utils@0.2.9`.
- Implementing `searchProp` requires widespread changes outside the files listed in scope.
- Controlled `open` behavior differs from existing tests in a way that suggests public API
  semantics would change.
- You need to loosen tests to make the refactor pass.
- TypeScript requires changing public component prop types for dropdown/context/select/
  combobox roots.

---

## 10. Maintenance Notes

- Future controlled store fields should follow this pattern: keep internal mutable state and
  external controlled prop state separate, then expose effective values through selectors.
- Avoid reintroducing component-local default initialization shims for persistent stores.
  Defaults belong in store construction or a store-owned one-time initialization method.
- If Base UI later exposes a helper for controlled/default state in `@base-ui/utils/store`,
  consider replacing this local pattern with that helper, but only after preserving the tests
  added in this plan.
