# Plan 002: Fold data-first behavior into `Surface`/`List`/`Popup`; remove `Data*` exports

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. This plan is **L effort / HIGH risk** and partly exploratory: where a
> step says "confirm the mechanism", do that before editing. If anything in
> "STOP conditions" occurs, stop and report. When done, update this plan's row in
> `plans/README.md`. **Depends on Plan 001
> (`plans/001-replace-datalist-render-prop-with-usedatalist-hook.md`) being DONE.**
>
> **Preconditions (run first)**:
> 1. **Plan 001 must be applied in the working tree** (it may be uncommitted).
>    Confirm with:
>    `rg -n "DataListContext.Provider" packages/react/src/internal/popup-menu/deep-search/data-list.tsx`
>    → expect a match (Plan 001 wraps `DataList` children in that provider). If
>    there is no match, STOP and execute Plan 001 first.
> 2. **Drift check** (compares the plan's baseline tree to your working tree):
>    `git diff --stat d2a3a03e -- packages/react/src/internal/popup-menu/deep-search packages/react/src/internal/popup-menu/components/surface packages/react/src/internal/popup-menu/components/list packages/react/src/internal/popup-menu/components/popup`
>    Expect to see ONLY Plan 001's edits — chiefly in `deep-search/data-list.tsx`
>    and `deep-search/context.ts`. If `components/surface`, `components/list`, or
>    `components/popup` show any edits, or the "Current state" excerpts below do
>    not match live code, treat it as a STOP condition.
>
> Baseline note: this plan was authored at `78715af7`, which is no longer an
> ancestor of HEAD after a history rewrite, but `git diff 78715af7..HEAD` is empty
> for every in-scope `popup-menu` dir, so the excerpts remain accurate. The
> baseline above is rebased to the current HEAD `d2a3a03e`.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH (removes 4 public components; reworks 3 primitives' internals)
- **Depends on**: `plans/001-replace-datalist-render-prop-with-usedatalist-hook.md`
- **Execution status**: RECONCILED 2026-06-13 (was BLOCKED at Step 3). The Step 3
  type-boundary blocker is now fully specified below with exact types and
  excerpts. Root cause: a prior attempt passed the primitive's `PopupMenuListProps`
  into `DataListInner`, whose props extended the NARROW data-list types
  (`className: string`, `style: CSSProperties`, `render: React.ReactElement`,
  `children: ReactNode`), while the primitive's `ComponentProps<'div', State>`
  types `className`/`style`/`render`/`children` as the wider "value-or-state-
  function" union. Fix (Step 3.2): base `DataListInnerProps` on the primitive
  `PopupMenuListProps` and forward those props by spread — `DataListInner` only
  ever passes `className`/`style`/`render` through to the inner list, so widening
  is safe. Ready to re-run from Step 1.
- **Category**: tech-debt / migration (public API unification)
- **Commit / PR title**: `refactor(popup-menu)!: unify data-first API into Surface/List/Popup`
  (Conventional Commits; `!` flags the removal of `DataSurface`/`DataList`/
  `DataInput`/`DataSubpages`. Use verbatim as the PR title and first commit subject.)
- **Planned at**: commit `d2a3a03e` (rebaselined from `78715af7`; in-scope
  popup-menu source is byte-identical between them). 2026-06-13

## Why this matters

Today the data-first menu API is a parallel set of components
(`DataSurface`/`DataList`/`DataInput`/`DataSubpages`) that mirror the primitives
(`Surface`/`List`/`Input` + manual `Subpage`s). Consumers must learn which set to
use and can't mix them. Unifying them — so `Surface` accepts the data-first
props, `List` renders data nodes when a data surface is present, and `Popup`
auto-renders data subpages — removes the duplicate surface area and gives one
mental model. After this lands,
`DataSurface`/`DataList`/`DataInput`/`DataSubpages` no longer exist publicly;
consumers use `Surface`/`List`/`Input` and (where needed) `useDataList()`.

## Repo facts (you need these; the executor has no other context)

- **Monorepo**: Turborepo + bun workspaces. Use **bun** only — never
  npm/yarn/pnpm/npx (`AGENTS.md`). Node >= 24.
- **Library package**: `@bazza-ui/react` at `packages/react` (published, pre-1.0
  canary). Changesets target `"@bazza-ui/react"`.
- **Primitives**: `packages/react/src/internal/popup-menu/components/*`.
  **Data-first wrappers**: `packages/react/src/internal/popup-menu/deep-search/*`.
- **Public entrypoints**: short names in
  `packages/react/src/{dropdown-menu,context-menu}/index.parts.ts`; prefixed
  names in the sibling `index.ts`. `combobox`/`select` do **not** expose `Data*`.
- **Tests**: Vitest, jsdom, globals; import from the public entrypoint, e.g.
  `import { DropdownMenu } from '../../../../dropdown-menu/index.js'`. Primary
  fixture: `packages/react/src/internal/popup-menu/deep-search/__tests__/data-list.test.tsx`.
- This plan assumes **Plan 001 is applied** (in the working tree; it may be
  uncommitted — confirm via the Preconditions above): `DataListContext`,
  `useDataList()`, `useMaybeDataList()` already exist in
  `packages/react/src/internal/popup-menu/deep-search/context.ts`, and `DataList`
  already takes normal children (no render-prop) — its `DataListInner` wraps
  children in `<DataListContext.Provider value={childrenState}>`.

## Current state

- `deep-search/data-surface.tsx` — `PopupMenuDataSurface` wraps
  `PopupMenuSurface`, forcing `filter={false}`, providing `DataSurfaceContext`,
  registering into `DataPopupContext`, and wrapping children in
  `DataSurfaceAsyncCoordinatorScope`. Data-first props it owns: `content`,
  `asyncContent`, `deepSearch`, `includeInDeepSearch`, `getQualifiedRowId` (plus
  search/nav props forwarded verbatim to `PopupMenuSurface`: `search`,
  `normalizeSearch`, `onSearchChange`, `defaultSearch`, `loop`,
  `autoHighlightFirst`, `clearSearchOnClose`, `resetScrollOnSearch`). Excerpt:

  ```tsx
  return (
    <DataSurfaceContext.Provider value={contextValue}>
      <PopupMenuSurface ref={forwardedRef} filter={false} search={searchProp}
        normalizeSearch={normalizeSearch} onSearchChange={onSearchChange}
        defaultSearch={defaultSearch} loop={loop}
        autoHighlightFirst={autoHighlightFirst}
        clearSearchOnClose={clearSearchOnClose}
        resetScrollOnSearch={resetScrollOnSearch} className={className}
        style={style} render={render}>
        <DataSurfaceAsyncCoordinatorScope>{children}</DataSurfaceAsyncCoordinatorScope>
      </PopupMenuSurface>
    </DataSurfaceContext.Provider>
  )
  ```

- `deep-search/data-list.tsx` — after Plan 001, `PopupMenuDataList` reads
  `useDataSurfaceContext()` + `useSurfaceContext()`, computes nodes in
  `DataListInner`, provides `DataListContext`, and renders normal children inside
  `PopupMenuList`.
- `components/surface/surface.tsx` — `PopupMenuSurface` props include `filter`,
  `search`, `normalizeSearch`, `loop`, `autoHighlightFirst`,
  `clearSearchOnClose`, `resetScrollOnSearch`, etc. (the search/nav layer).
- `components/list/list.tsx` — primitive `PopupMenuList`; render-prop guarded by
  `typeof children === 'function'`, state `{ search, filteredCount }`.
- `components/popup/popup.tsx` — `PopupMenuPopup` provides `SubpageStackContext`
  and `DataPopupContext`, and renders `{children}` verbatim. Owns subpage
  navigation state but does **not** auto-render subpage content.
- `deep-search/data-subpages.tsx` — `PopupMenuDataSubpages` reads
  `useDataPopupContext().dataSurfaceContext.content`, collects subpage nodes, and
  renders each node's `renderContent(...)`. Mounted manually as a sibling of
  `DataSurface`.
- `deep-search/data-input.tsx` — `DataInput` is a pure re-export of
  `PopupMenuInput`:

  ```ts
  export {
    PopupMenuInput as PopupMenuDataInput,
    type PopupMenuInputProps as PopupMenuDataInputProps,
  } from '../components/input/input.js'
  ```

- Public short-name exports — `dropdown-menu/index.parts.ts` (same in
  `context-menu/index.parts.ts`):

  ```ts
  PopupMenuDataInput as DataInput,
  PopupMenuDataList as DataList,
  PopupMenuDataSubpages as DataSubpages,
  PopupMenuDataSurface as DataSurface,
  // ...
  PopupMenuInput as Input,
  PopupMenuList as List,
  PopupMenuPopup as Popup,
  PopupMenuSurface as Surface,
  ```

- Prefixed exports — `dropdown-menu/index.ts` (~305) and `context-menu/index.ts`
  (~277): `PopupMenuDataInput as DropdownMenuDataInput`, etc., plus the `Data*`
  types around lines 244–271 / 228–253.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck (all) | `bun run type-check` | exit 0, no errors |
| Test (all) | `bun run test` | all pass |
| Test (single file) | `cd packages/react && bun run test src/internal/popup-menu/deep-search/__tests__/data-list.test.tsx` | target passes |
| Lint + format (write) | `bun run check:fix` | exit 0 |
| Lint + format (check) | `bun run check` | exit 0 |
| Build (all) | `bun run build` | exit 0 |

## Scope

**In scope**:

- `deep-search/data-surface.tsx`, `components/surface/surface.tsx` — move
  data-first props onto `Surface`; `Surface` enters "data mode" when data props
  are present (provide `DataSurfaceContext`, force `filter={false}`, mount the
  async coordinator scope).
- `components/list/list.tsx`, `deep-search/data-list.tsx` — primitive `List`
  computes/provides node state (`DataListContext`) when inside a data surface;
  reuse the Plan 001 context + `DataListInner` logic.
- `components/popup/popup.tsx`, `deep-search/data-subpages.tsx` — auto-render data
  subpages from `Popup`.
- `deep-search/data-input.tsx` — remove (was a pure re-export of `Input`).
- All barrels: remove `DataSurface`/`DataList`/`DataInput`/`DataSubpages` (short +
  prefixed names + `Data*Props` types) from `dropdown-menu/index.parts.ts`,
  `dropdown-menu/index.ts`, `context-menu/index.parts.ts`,
  `context-menu/index.ts`, `internal/popup-menu/index.ts`,
  `internal/popup-menu/deep-search/index.ts`.
- Migrate every consumer (Plan 001's consumer list) from
  `DataSurface`/`DataList`/`DataInput`/`DataSubpages` to `Surface`/`List`/`Input`
  (+ remove manual `<DataSubpages />` where `Popup` now auto-renders).
- Docs: `apps/web/content/docs/dropdown-menu/api-reference.mdx`,
  `apps/web/content/docs/context-menu/index.mdx`; doc allow-list
  `apps/web/scripts/build-types-meta.ts` (~654–656).
- One changeset file.

**Out of scope**:

- Search/scoring/deep-search internals — only their wiring moves; do not change
  scoring algorithms.
- `useDataList()`/`useMaybeDataList()` and `DataListContext` from Plan 001 — keep
  them; `List` now provides the context.
- `combobox`/`select` entrypoints.
- Generated artifacts under `apps/web/.types/` and `apps/web/public/r/**`.

## Git workflow

- Branch (stacked on Plan 001's branch): `ui-301-unify-data-first-menu-api`.
- PR title / first commit subject: use the **Commit / PR title** from the Status
  block verbatim —
  `refactor(popup-menu)!: unify data-first API into Surface/List/Popup`.
  Any further commits (if you split the work) follow Conventional Commits too.
- Do not `gt submit` until the operator asks.

## Steps

### Step 1: Confirm the data-mode mechanism before editing (spike)

Read `components/surface/surface.tsx` end-to-end and confirm:
- where `filter` is consumed, and that forcing `filter={false}` in data mode is
  side-effect free;
- that `DataSurfaceContext.Provider` + `DataSurfaceAsyncCoordinatorScope` can be
  rendered from inside `Surface` without breaking the existing non-data Surface
  path (data mode must be **opt-in**, triggered only when a data prop like
  `content`/`asyncContent`/`deepSearch` is supplied).

Record findings in this plan's `plans/README.md` status note. If `Surface`
cannot host the data-mode providers without altering non-data behavior, **STOP
and report**.

**Verify**: no code change yet; `bun run type-check` → exit 0 (baseline).

### Step 2: Move data-first props onto `Surface`

Add the data-first props (`content`, `asyncContent`, `deepSearch`,
`includeInDeepSearch`, `getQualifiedRowId`) to `PopupMenuSurfaceProps`. When any
are present, `Surface` does what `DataSurface` did: build the
`DataSurfaceContextValue`, provide `DataSurfaceContext`, register into
`DataPopupContext`, force `filter={false}`, and wrap children in
`DataSurfaceAsyncCoordinatorScope`. Reuse the exact logic from
`data-surface.tsx` (move it, don't reinvent). Keep `data-surface.tsx`
temporarily as a thin alias so the build stays green between steps.

**Verify**: `bun run type-check` → exit 0;
`cd packages/react && bun run test src/internal/popup-menu/deep-search/__tests__/data-list.test.tsx`
→ still passes (tests still use the `DataSurface` alias).

### Step 3: Make primitive `List` provide data node state

Goal: a bare `<List>` rendered inside a data surface behaves like today's
`DataList` (computes nodes, provides `DataListContext`), while a `<List>` outside
a data surface is unchanged. Do this by splitting the primitive from a thin
data-aware wrapper and routing data mode through the existing `DataListInner`.

This is the step that BLOCKED the prior attempt (a type-boundary error). The
exact types and excerpts below are the fix — follow them precisely.

> **Type facts you need (verified against live code):**
> `ComponentProps<'div', State>` in `packages/react/src/utils/types.ts` types:
> - `className?: string | ((state: State) => string | undefined)`
> - `style?: React.CSSProperties | ((state: State) => React.CSSProperties | undefined)`
> - `render?: ComponentRenderFn<HTMLProps, State> | React.ReactElement`
>
> `PopupMenuListProps` extends `Omit<ComponentProps<'div', PopupMenuList.State>, 'children'>`
> and adds `children: React.ReactNode | ((state: PopupMenuListChildrenState) => React.ReactNode)`,
> `label?`, `measureRowWidth?`, `maxRowWidth?`, `scrollContainerRef?`.
> The data-list types are NARROWER (`className?: string`, `style?: CSSProperties`,
> `render?: React.ReactElement`, `children: React.ReactNode`). Assigning the wide
> primitive props into the narrow data-list slots is what failed typecheck.

#### Step 3.1 — Split `PopupMenuList` into primitive + wrapper (`components/list/list.tsx`)

1. **Rename the existing component to `PopupMenuListPrimitive`.** It is currently
   (line ~82):
   ```tsx
   export const PopupMenuList = React.forwardRef<
     HTMLDivElement,
     PopupMenuList.Props
   >(function PopupMenuList(props, forwardedRef) {
   ```
   Rename BOTH the `const` and the inner function to `PopupMenuListPrimitive`,
   keep the generic `<HTMLDivElement, PopupMenuList.Props>` and the entire body
   byte-for-byte. It stays a named `export`. Leave the
   `export namespace PopupMenuList { ... }` block (lines ~247–250) untouched — it
   still types the public wrapper (same `Props`).

2. **Add two imports** at the top of the file (these create a
   `list.tsx ⇄ data-list.tsx` import cycle, which is safe because both symbols are
   used only at render time, never at module-eval time; esbuild/tsup handle it):
   ```ts
   import { useMaybeDataSurfaceContext } from '../../deep-search/context.js'
   import { DataListInner } from '../../deep-search/data-list.js'
   ```

3. **Add the new wrapper** immediately after `PopupMenuListPrimitive`, keeping the
   public name/type `PopupMenuList`:
   ```tsx
   export const PopupMenuList = React.forwardRef<
     HTMLDivElement,
     PopupMenuList.Props
   >(function PopupMenuList(props, forwardedRef) {
     // Hooks run unconditionally and in stable order. List is always inside a
     // Surface, so useSurfaceContext() is safe (the primitive already relies on it).
     const dataSurfaceCtx = useMaybeDataSurfaceContext()
     const { store } = useSurfaceContext()
     const search = store.useState('search')
     const normalizedSearch = store.useState('normalizedSearch')

     if (dataSurfaceCtx) {
       return (
         <DataListInner
           ref={forwardedRef}
           {...props}
           content={dataSurfaceCtx.content}
           asyncContent={dataSurfaceCtx.asyncContent}
           deepSearchConfig={dataSurfaceCtx.deepSearchConfig}
           includeInDeepSearch={dataSurfaceCtx.includeInDeepSearch}
           getQualifiedRowId={dataSurfaceCtx.getQualifiedRowId}
           search={search}
           normalizedSearch={normalizedSearch}
           store={store}
         />
       )
     }

     return <PopupMenuListPrimitive ref={forwardedRef} {...props} />
   })
   ```
   `useSurfaceContext` is already imported in this file. This wrapper is, in
   effect, today's `PopupMenuDataList` body merged with the non-data passthrough.

   **Why a wrapper (do not inline into the primitive):** `DataListInner` renders a
   list element. If the data-mode check lived in the component `DataListInner`
   renders, it would recurse infinitely. The wrapper checks context once;
   `DataListInner` renders the PRIMITIVE (`PopupMenuListPrimitive`), so there is no
   recursion.

#### Step 3.2 — Point `DataListInner` at the primitive and widen its prop types (`deep-search/data-list.tsx`)

1. **Change the import** (line 6) from:
   ```ts
   import { PopupMenuList } from '../components/list/list.js'
   ```
   to:
   ```ts
   import {
     PopupMenuListPrimitive,
     type PopupMenuListProps,
   } from '../components/list/list.js'
   ```

2. **Replace `DataListInnerProps` so it extends the primitive props** (this is the
   blocker fix). It currently reads:
   ```ts
   interface DataListInnerProps extends PopupMenuDataListProps {
     content: NodeDef[]
     asyncContent: ReturnType<typeof useDataSurfaceContext>['asyncContent']
     deepSearchConfig: ReturnType<typeof useDataSurfaceContext>['deepSearchConfig']
     includeInDeepSearch: ReturnType<
       typeof useDataSurfaceContext
     >['includeInDeepSearch']
     getQualifiedRowId: GetQualifiedRowIdFn
     search: string
     normalizedSearch: string
     store: ReturnType<typeof useSurfaceContext>['store']
   }
   ```
   Change it to (note `export` — the wrapper imports it — and `extends PopupMenuListProps`):
   ```ts
   export interface DataListInnerProps extends PopupMenuListProps {
     content: NodeDef[]
     asyncContent: ReturnType<typeof useDataSurfaceContext>['asyncContent']
     deepSearchConfig: ReturnType<typeof useDataSurfaceContext>['deepSearchConfig']
     includeInDeepSearch: ReturnType<
       typeof useDataSurfaceContext
     >['includeInDeepSearch']
     getQualifiedRowId: GetQualifiedRowIdFn
     search: string
     normalizedSearch: string
     store: ReturnType<typeof useSurfaceContext>['store']
   }
   ```
   `PopupMenuDataListProps`/`DataListProps` stay defined and still type the
   temporary `PopupMenuDataList`. `PopupMenuDataListProps` (narrow) is assignable
   into `DataListInnerProps` (wide), so the existing `PopupMenuDataList` keeps
   compiling.

3. **Export `DataListInner`** — change `const DataListInner = React.forwardRef<`
   to `export const DataListInner = React.forwardRef<`.

4. **Forward the primitive props by spread.** Update the destructure (currently
   pulls `children, label = 'Menu', className, style, render, measureRowWidth,
   maxRowWidth, scrollContainerRef, content, …`) to pull only the data-context
   fields plus `children` and a `label` default, and gather the rest as
   `listProps`:
   ```tsx
   const {
     children,
     content,
     asyncContent,
     deepSearchConfig,
     includeInDeepSearch,
     getQualifiedRowId,
     search,
     normalizedSearch,
     store,
     label = 'Menu',
     ...listProps
   } = props
   ```
   Then change the list element in the return. It currently reads:
   ```tsx
   <PopupMenuList
     ref={forwardedRef}
     label={label}
     className={className}
     style={style}
     render={render}
     measureRowWidth={measureRowWidth}
     maxRowWidth={maxRowWidth}
     scrollContainerRef={scrollContainerRef}
   >
     <DataListContext.Provider value={childrenState}>
       {children}
     </DataListContext.Provider>
   </PopupMenuList>
   ```
   Replace with (provider wraps the PRIMITIVE element; `children` passes straight
   through, so it keeps its primitive union type — no cast — and `useDataList()`
   still resolves for every descendant):
   ```tsx
   <DataListContext.Provider value={childrenState}>
     <PopupMenuListPrimitive ref={forwardedRef} label={label} {...listProps}>
       {children}
     </PopupMenuListPrimitive>
   </DataListContext.Provider>
   ```
   Keep the `{shouldRenderAsyncLoaders && ( … )}` block exactly as-is, as the
   sibling immediately BEFORE the provider, inside the existing `<> … </>`
   fragment (it must stay outside the provider, as today).

   If TypeScript complains that `ref` appears in `...listProps`, drop it
   explicitly in the destructure: `const { ref: _ref, label = 'Menu', ...listProps } = props`.
   (Normally `forwardRef` strips `ref` from `props`, so this is usually
   unnecessary.)

**Intended behavior note:** because data-mode `List` now accepts the primitive
`children` union, a function child is allowed and the primitive will invoke it
with `{ search, filteredCount }`. Data consumers should still read rich node state
via `useDataList()`. This is a strict superset of today's `DataList` (which took
only `ReactNode`).

#### Step 3.3 — Leave `DataList` working unchanged

Do NOT modify `PopupMenuDataList` here — it still reads `useDataSurfaceContext()`
+ `useSurfaceContext()` and renders `DataListInner` (which now renders the
primitive). It keeps compiling (narrow props assignable to wide). The temporary
`DataList` alias stays for Steps 4–5.

**Verify (Step 3):**
- `bun run type-check` → exit 0. (If it fails on `className`/`style`/`render`/
  `children`, you did NOT base `DataListInnerProps` on `PopupMenuListProps` —
  re-check 3.2.2.)
- `cd packages/react && bun run test src/internal/popup-menu/deep-search/__tests__/data-list.test.tsx`
  → still passes (existing `DataList` behavior unchanged).
- Confirm `combobox`/`select` (which share this same `PopupMenuList`) never sit
  under a data surface, so their lists stay primitive:
  `rg -n "DataSurface|useDataSurfaceContext|asyncContent|deepSearch" packages/react/src/combobox packages/react/src/select`
  → expect no data-surface usage. If any appears, STOP.

#### Step 3.4 — Add a data-mode `List` test (proves this step)

In `deep-search/__tests__/data-list.test.tsx`, add a test that renders a bare
`<DropdownMenu.List>` (NOT `DataList`) inside the standard data tree — using the
`DataSurface` alias, which provides `DataSurfaceContext` after Step 2 — with a
child component that calls `useDataList()`, and assert the nodes render:
```tsx
function Items() {
  const { nodes, renderNode, count } = DropdownMenu.useDataList()
  return (
    <>
      <div data-testid="count">{count}</div>
      {nodes.map(renderNode)}
    </>
  )
}
// render inside Root/Portal/Positioner/Popup:
//   <DropdownMenu.DataSurface content={...}>
//     <DropdownMenu.DataInput data-testid="search-input" />
//     <DropdownMenu.List><Items /></DropdownMenu.List>
//   </DropdownMenu.DataSurface>
// then: expect(screen.getByTestId('count')).toHaveTextContent(String(expected))
```
Model the surrounding tree on the existing fixtures in this file.

**Verify**:
`cd packages/react && bun run test src/internal/popup-menu/deep-search/__tests__/data-list.test.tsx`
→ all pass, including the new test.

### Step 4: Auto-render data subpages from `Popup`

In `Popup`, when a `DataPopupContext` with `content` is present, render the data
subpages automatically (the work `DataSubpages` does today) so consumers no
longer mount `<DataSubpages />`. Keep `DataSubpages` as a temporary no-op/alias
until consumers are migrated.

**Verify**: `cd packages/react && bun run test` → all pass; manually confirm a
subpages example still renders subpages (the deep-search-subpages example).

### Step 5: Migrate all consumers to `Surface`/`List`/`Input`

For every consumer from Plan 001's list (registry wrappers under
`apps/web/registry/ui/`, examples under
`apps/web/registry/examples/dropdown-menu/`, the playground
`apps/web/app/playground/menu/menu-playground.tsx`, and the package tests):
- `DataSurface` → `Surface` (move data props across unchanged).
- `DataInput` → `Input`.
- `DataList` → `List`.
- Remove `<DataSubpages />` siblings (Popup auto-renders now).

**Verify**: `bun run type-check` → exit 0; `bun run test` → all pass.

### Step 6: Remove the `Data*` public components and aliases

Delete `deep-search/data-input.tsx`; remove `DataSurface`/`DataList`/
`DataSubpages` components/aliases and the temporary aliases from Steps 2–4.
Remove all `Data*` exports (short names, prefixed names, `Data*Props` types) from
the four entrypoint barrels and the two internal barrels. Keep
`useDataList`/`useMaybeDataList`/`DataListContext`/`useDataSurfaceContext` etc.

**Verify**:
- `rg -n "DataSurface|DataList|DataInput|DataSubpages" packages/react/src` → only
  `DataListContext`/`useDataList`/`DataSurfaceContext`/internal type names remain;
  no `PopupMenuDataList`/`PopupMenuDataSurface`/`PopupMenuDataInput`/
  `PopupMenuDataSubpages` component exports.
- `bun run type-check` → exit 0.

### Step 7: Update docs + doc allow-list

Update `api-reference.mdx` / context-menu `index.mdx` to document the unified
`Surface`/`List`/`Input` data props and `useDataList()`; remove the
`DataSurface`/`DataList`/`DataInput` sections. Remove `'DataInput'`, `'DataList'`,
`'DataSurface'` from the allow-list in
`apps/web/scripts/build-types-meta.ts` (~654–656).

**Verify**: `bun run build` → exit 0 (docs type-gen + registry build succeed).

### Step 8: Changeset + full verification

Create `.changeset/<slug>.md`:

```md
---
"@bazza-ui/react": patch
---

Unify the data-first popup menu API: `Surface`/`List`/`Input` now accept the
data-first props directly and `Popup` auto-renders data subpages. Removes
`DataSurface`, `DataList`, `DataInput`, and `DataSubpages`. This is a breaking
change.
```

**Verify (all must pass)**: `bun run type-check`, `bun run test`, `bun run check`,
`bun run build` → all exit 0.

## Test plan

- Update `deep-search/__tests__/data-list.test.tsx` and
  `components/empty/empty.test.tsx` to use `Surface`/`List`/`Input` instead of
  `Data*` (the Plan 001 `useDataList()` child-component pattern carries over).
- Add a test: a plain `<DropdownMenu.List>` inside a data `<Surface>` exposes
  nodes via `useDataList()` (proves Step 3).
- Add a test: data subpages render from `Popup` without a `<DataSubpages />`
  sibling (proves Step 4) — model after the existing subpages fixture in
  `data-list.test.tsx`.
- Verification: `cd packages/react && bun run test` → all pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run type-check` exits 0
- [ ] `bun run test` exits 0; new data-mode `List` + auto-subpage tests pass
- [ ] `bun run check` exits 0
- [ ] `bun run build` exits 0
- [ ] `rg -n "as DataSurface|as DataList|as DataInput|as DataSubpages" packages/react/src` returns no matches (public aliases gone)
- [ ] `rg -n "PopupMenuDataList|PopupMenuDataSurface|PopupMenuDataInput|PopupMenuDataSubpages" packages/react/src` returns no component definitions/exports
- [ ] `rg -n "DataSurface|DataList|DataInput|DataSubpages" apps/web/registry apps/web/app` returns no usages (consumers migrated)
- [ ] A changeset targeting `"@bazza-ui/react": patch` exists in `.changeset/`
- [ ] `git status` shows no files modified outside the in-scope list
- [ ] This plan's row in `plans/README.md` updated

## STOP conditions

Stop and report (do not improvise) if:

- Step 1 reveals `Surface` cannot host the data-mode providers without changing
  non-data Surface behavior.
- Folding `DataListInner` into `List` would require importing app/registry-level
  code or break the primitive `List`'s existing render-prop.
- The `list.tsx ⇄ data-list.tsx` import cycle (Step 3.1) causes a build/runtime
  error (e.g. `DataListInner` or `PopupMenuListPrimitive` is `undefined` at module
  init, or tsup/esbuild reports a cycle failure). STOP — breaking the cycle means
  relocating `DataListInner` or the data-mode branch, which is a design change, not
  an improvisation.
- A primitive `<List>` is rendered under a data surface for a NON-data purpose
  (e.g. inside subpage content that should stay a plain list). The
  `useMaybeDataSurfaceContext()` trigger would force it into data mode. STOP and
  report — the trigger would need to be made explicit rather than context-presence
  based. (Search for nested `List`/`DataList` inside subpage `renderContent` and
  in the deep-search-subpages examples before assuming this is safe.)
- `Popup` auto-rendering subpages double-renders or conflicts with any consumer
  that still mounts a manual `<Subpage>`.
- Removing a `Data*` export breaks `combobox`/`select` (it shouldn't — confirm).
- The "Current state" excerpts don't match live code (drift since `78715af7`).
- Any verification fails twice after a reasonable fix attempt.

## Maintenance notes

- Riskiest change in the stack; reviewer should scrutinize: data mode is strictly
  opt-in on `Surface`/`List` (non-data menus unaffected); subpage auto-render
  doesn't regress manual `<Subpage>` usage; no `Data*` symbol survives in public
  barrels or docs.
- Because Plan 001 already moved consumers to `useDataList()`, the `List`
  migration here is mostly a tag rename (`DataList` → `List`) plus deleting
  `DataSubpages` siblings.
- After Step 3, `PopupMenuList` is a thin wrapper over `PopupMenuListPrimitive`;
  `DataListInner` renders the PRIMITIVE to avoid infinite recursion. Keep that
  split — do not let `DataListInner` render the wrapper.
- Data mode is triggered by `useMaybeDataSurfaceContext()` being non-null, so
  EVERY `List` under a data `Surface` becomes a data list. Nested non-data lists
  under a data surface are unsupported; use a nested `Surface` (which provides its
  own context) or refactor. Review new subpage / nested-list code for this.
- `combobox`/`select` share the same `PopupMenuList` symbol but are never under a
  data surface, so they take the primitive path. The Step 3 verify grep guards
  this; keep it true if data surfaces ever expand to those entrypoints.
- Keep `useDataList`/`DataListContext` — they are the supported public surface
  after this lands.
- Bump level `patch` mirrors Plan 001; reconsider `minor` if the team changes the
  pre-1.0 breaking-change policy.
