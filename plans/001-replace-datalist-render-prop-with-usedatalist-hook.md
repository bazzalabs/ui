# Plan 001: Replace `DataList` render-prop with `DataListContext` + `useDataList()`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in "STOP conditions" occurs, stop and report — do not
> improvise. When done, update this plan's row in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 78715af7..HEAD -- packages/react/src/internal/popup-menu/deep-search/data-list.tsx packages/react/src/internal/popup-menu/deep-search/types.ts packages/react/src/internal/popup-menu/deep-search/context.ts`
> If any in-scope file changed since `78715af7`, compare the "Current state"
> excerpts below against the live code before proceeding; on a mismatch, treat it
> as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (breaking public API: removes the `DataList` render-prop)
- **Depends on**: none
- **Category**: tech-debt / dx (API ergonomics)
- **Commit / PR title**: `refactor(popup-menu)!: replace DataList render-prop with useDataList()`
  (Conventional Commits; `!` flags the breaking `DataList` API change. Use verbatim
  as the PR title and first commit subject.)
- **Planned at**: commit `78715af7`, 2026-06-13

## Why this matters

`DataList` is the only component in the library that requires a
children-as-function (render-prop) to read its computed node state. Every
consumer must nest a function and destructure `{ nodes, renderNode, ... }`, which
blocks composition (you can't move list items into their own component without
threading props) and is inconsistent with the rest of the data-first API, which
is context-driven. Replacing the render-prop with a `DataListContext` +
`useDataList()` hook lets list content live in normal child components, matches
the existing `useDataSurfaceContext` pattern, and is the prerequisite for Plan
002 (which folds `DataList` into the primitive `List`). After this lands,
`<DataList>` takes normal children and any descendant calls `useDataList()` to
read node state.

## Repo facts (you need these; the executor has no other context)

- **Monorepo**: Turborepo + bun workspaces. Use **bun** only — never
  npm/yarn/pnpm/npx (`AGENTS.md`). Node >= 24.
- **Library package**: `@bazza-ui/react` at `packages/react` (published, pre-1.0
  canary). Changesets target `"@bazza-ui/react"`.
- **Public entrypoints** re-export popup-menu symbols under short names from
  `packages/react/src/dropdown-menu/index.parts.ts` and
  `packages/react/src/context-menu/index.parts.ts`; under prefixed names from the
  sibling `index.ts`. `combobox`/`select` do **not** expose `Data*`.
- **Tests**: Vitest, jsdom, globals on; setup `packages/react/test/setup.ts`;
  uses `@testing-library/react` + `@testing-library/user-event` +
  `@testing-library/jest-dom`. Tests import from the public entrypoint, e.g.
  `import { DropdownMenu } from '../../../../dropdown-menu/index.js'`. Exemplar to
  model new tests on:
  `packages/react/src/internal/popup-menu/deep-search/__tests__/data-list.test.tsx`.

## Current state

Files and their roles:

- `packages/react/src/internal/popup-menu/deep-search/data-list.tsx` — defines
  `PopupMenuDataList` (public `DataList`). It reads context and delegates to
  `DataListInner`, which computes node state and **invokes `children` as a
  function**.
- `packages/react/src/internal/popup-menu/deep-search/types.ts` — defines
  `DataListChildrenState` and `DataListProps` (whose `children` is a function).
- `packages/react/src/internal/popup-menu/deep-search/context.ts` — defines the
  existing data contexts and their `useX`/`useMaybeX` hooks. **Model the new hook
  on these.**
- Barrels that must re-export the new hook:
  `packages/react/src/internal/popup-menu/index.ts`,
  `packages/react/src/internal/popup-menu/deep-search/index.ts`,
  `packages/react/src/dropdown-menu/index.parts.ts`,
  `packages/react/src/dropdown-menu/index.ts`,
  `packages/react/src/context-menu/index.parts.ts`,
  `packages/react/src/context-menu/index.ts`.

Current render-prop invocation — `deep-search/data-list.tsx` (inside
`DataListInner`, around line 1306–1352):

```tsx
// Build children state
const childrenState: DataListChildrenState = React.useMemo(
  () => ({
    search,
    nodes: displayNodes,
    renderNode,
    count: displayNodes.length,
    isDeepSearching,
    async: asyncState,
  }),
  [search, displayNodes, renderNode, isDeepSearching, asyncState],
)

const renderedChildren = children(childrenState)   // <-- unconditional fn call

// ...
<PopupMenuList ref={forwardedRef} label={label} className={className} ... >
  {renderedChildren}
</PopupMenuList>
```

Current prop type — `deep-search/types.ts` (around line 1356):

```ts
export interface DataListProps {
  /** Render function for the list content. */
  children: (state: DataListChildrenState) => React.ReactNode
  label?: string
  className?: string
  style?: React.CSSProperties
  // ...measureRowWidth, maxRowWidth, scrollContainerRef
}
```

`DataListChildrenState` — `deep-search/types.ts` (around line 1324):

```ts
export interface DataListChildrenState {
  search: string
  nodes: DisplayNode[]
  renderNode: (displayNode: DisplayNode) => React.ReactNode
  count: number
  isDeepSearching: boolean
  async: AsyncState
}
```

Existing hook pattern to copy — `deep-search/context.ts`:

```ts
export const DataSurfaceContext =
  React.createContext<DataSurfaceContextValue | null>(null)

export function useDataSurfaceContext(): DataSurfaceContextValue {
  const context = React.useContext(DataSurfaceContext)
  if (!context) {
    throw new Error(
      'useDataSurfaceContext must be used within a DataSurface component',
    )
  }
  return context
}

export function useMaybeDataSurfaceContext(): DataSurfaceContextValue | null {
  return React.useContext(DataSurfaceContext)
}
```

Existing public hook re-export to copy — `dropdown-menu/index.parts.ts` already
exports coordinator hooks the same way the new hook should be exported:

```ts
  // Async coordinator hooks
  useAsyncMenuCoordinator,
  useMaybeAsyncMenuCoordinator,
} from '../internal/popup-menu/index.js'
```

Canonical consumer shape today (representative) —
`deep-search/__tests__/data-list.test.tsx` (around line 173):

```tsx
<DropdownMenu.DataList>
  {({ nodes, renderNode, count }) => (
    <>
      <div data-testid="count">{count}</div>
      {nodes.map(renderNode)}
    </>
  )}
</DropdownMenu.DataList>
```

> The **primitive** `PopupMenuList` (`components/list/list.tsx`) has its *own*
> render-prop with a different, smaller state (`{ search, filteredCount }`),
> guarded by `typeof children === 'function'`. That is a separate API and is
> **out of scope for this plan** — do not change it.

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

**In scope** (modify only these):

- `packages/react/src/internal/popup-menu/deep-search/context.ts` — add
  `DataListContext`, `useDataList()`, `useMaybeDataList()`.
- `packages/react/src/internal/popup-menu/deep-search/data-list.tsx` — provide
  the context; render `children` as a normal node.
- `packages/react/src/internal/popup-menu/deep-search/types.ts` — change
  `DataListProps.children` to `React.ReactNode`.
- `packages/react/src/internal/popup-menu/index.ts` — re-export new hooks.
- `packages/react/src/internal/popup-menu/deep-search/index.ts` — re-export new hooks.
- `packages/react/src/dropdown-menu/index.parts.ts` + `dropdown-menu/index.ts` — re-export new hooks.
- `packages/react/src/context-menu/index.parts.ts` + `context-menu/index.ts` — re-export new hooks.
- Consumers using the `DataList` render-prop (migrate to child component +
  `useDataList()`) — full list in Step 5.
- The registry wrapper `apps/web/registry/ui/dropdown-menu/index.tsx` (its own
  `DataList` forwards a render-prop into `Primitive.DataList`).
- One changeset file under `.changeset/`.

**Out of scope** (do NOT touch, even though related):

- `packages/react/src/internal/popup-menu/components/list/list.tsx` — the
  primitive `List` render-prop stays as-is (Plan 002 territory).
- Renaming/removing `DataSurface`, `DataInput`, `DataSubpages`, `DataList`
  (that is Plan 002).
- `combobox`/`select` entrypoints — they don't expose `Data*`.
- Generated artifacts: `apps/web/.types/types-meta.json`, `apps/web/public/r/**`
  (regenerated by build, never hand-edited).

## Git workflow

- Stage with `git add`, then create the branch with `gt create` **after**
  writing the code.
- Branch name: `ui-300-replace-datalist-children-as-function-with-usedatalist-hook`.
- PR title / first commit subject: use the **Commit / PR title** from the Status
  block verbatim —
  `refactor(popup-menu)!: replace DataList render-prop with useDataList()`.
  Any further commits (if you split the work) follow Conventional Commits too.
- Do not `gt submit` until the operator asks.

## Steps

### Step 1: Add `DataListContext` + hooks

In `deep-search/context.ts`, add a context holding `DataListChildrenState` and
two hooks modeled exactly on `useDataSurfaceContext`/`useMaybeDataSurfaceContext`:

```ts
import type { DataListChildrenState } from './types.js'

export const DataListContext =
  React.createContext<DataListChildrenState | null>(null)

export function useDataList(): DataListChildrenState {
  const context = React.useContext(DataListContext)
  if (!context) {
    throw new Error('useDataList must be used within a DataList component')
  }
  return context
}

export function useMaybeDataList(): DataListChildrenState | null {
  return React.useContext(DataListContext)
}
```

**Verify**: `bun run type-check` → exit 0.

### Step 2: Provide the context and render normal children in `DataListInner`

In `deep-search/data-list.tsx`, import `DataListContext` from `./context.js`.
Replace the render-prop invocation with a context provider wrapping the children
passed to `PopupMenuList`:

```tsx
// childrenState stays exactly as-is
return (
  <>
    {shouldRenderAsyncLoaders && (/* ...unchanged... */)}
    <PopupMenuList ref={forwardedRef} label={label} /* ...unchanged props... */>
      <DataListContext.Provider value={childrenState}>
        {children}
      </DataListContext.Provider>
    </PopupMenuList>
  </>
)
```

Remove the `const renderedChildren = children(childrenState)` line and the
`{renderedChildren}` usage. `children` is now `React.ReactNode`.

**Verify**: `bun run type-check` → will fail in `types.ts` and consumers until
Steps 3–5 are done; expected. Confirm the only new errors are "children is
possibly a function / not assignable" style, not unrelated errors.

### Step 3: Change the `children` prop type

In `deep-search/types.ts`, change `DataListProps.children`:

```ts
export interface DataListProps {
  /** List content. Descendants read node state via `useDataList()`. */
  children: React.ReactNode
  label?: string
  className?: string
  style?: React.CSSProperties
  // ...rest unchanged
}
```

**Verify**: `bun run type-check` → remaining errors should now be only in
consumer files (they still pass a function). Proceed.

### Step 4: Re-export the hooks through every barrel that exposes the data API

Add `useDataList` and `useMaybeDataList` alongside the existing data context
hooks / coordinator hooks in each barrel:

- `internal/popup-menu/deep-search/index.ts` — export from `./context.js`.
- `internal/popup-menu/index.ts` — re-export from `./deep-search/index.js`
  (next to `useDataSurfaceContext`).
- `dropdown-menu/index.parts.ts` — add to the block imported
  `from '../internal/popup-menu/index.js'` (next to `useAsyncMenuCoordinator`).
- `dropdown-menu/index.ts` — re-export (next to `useDataSurfaceContext`).
- `context-menu/index.parts.ts` and `context-menu/index.ts` — same as dropdown.

This makes the hook reachable as `DropdownMenu.useDataList` /
`ContextMenu.useDataList` (matching how `useAsyncMenuCoordinator` is surfaced).

**Verify**: `bun run type-check` → no new barrel errors (consumer errors remain).

### Step 5: Migrate every render-prop consumer to a child component + `useDataList()`

Mechanical transform — for each `<DataList>{(state) => JSX}</DataList>`:

```tsx
// BEFORE
<DropdownMenu.DataList>
  {({ nodes, renderNode }) => <>{nodes.map(renderNode)}</>}
</DropdownMenu.DataList>

// AFTER
function DataListItems() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}
// ...
<DropdownMenu.DataList>
  <DataListItems />
</DropdownMenu.DataList>
```

Rules:
- Keep the same destructured fields (`nodes`, `renderNode`, `count`, `search`,
  `isDeepSearching`, `async`). All are on the value returned by `useDataList()`.
- The child component must be rendered **inside** `<DataList>` (it reads context).
- Preserve non-render-prop props on `<DataList>` (`virtualized`, `className`,
  `maxHeight`, etc. as used by the registry wrapper).
- Where children are already a static node (not a function), leave them — two
  `DataList` usages pass a static `<Empty>` child:
  `apps/web/registry/ui/filter/components/menu/filter-menu.tsx:99` and
  `apps/web/registry/ui/filter/components/value/editors/option-editor.tsx:134`.
  Do not convert them.

Consumer files to migrate (render-prop usages):

Registry wrappers (`apps/web/registry/ui/`):
- `dropdown-menu/index.tsx` (both branches: virtualized ~365 and
  non-virtualized ~401 — the wrapper threads a render-prop into
  `Primitive.DataList`; convert to a child using `Primitive.useDataList()`)
- `filter/components/menu/filter-menu.tsx` (~538)
- `filter/components/value/editors/text-editor.tsx` (~36)
- `filter/components/item/filter-operator.tsx` (~202)

Examples (`apps/web/registry/examples/dropdown-menu/`):
- `async/index.tsx` (~154, ~225)
- `async-deep-search/index.tsx` (~244, ~302)
- `deep-search/index.tsx` (~277)
- `deep-search-linear/index.tsx` (~313), `deep-search-linear/components.tsx` (~248, ~308)
- `deep-search-linear-async/index.tsx` (~398), `deep-search-linear-async/components.tsx` (~253, ~331)
- `deep-search-linear-async-tanstack/index.tsx` (~420)
- `deep-search-subpages-linear/index.tsx` (~395, ~831)
- `linear-subpage-label-creation/index.tsx` (~590)

Playground (`apps/web/app/playground/menu/`):
- `menu-playground.tsx` (~3316, ~3805, ~4308)

Tests (`packages/react/src/`):
- `internal/popup-menu/deep-search/__tests__/data-list.test.tsx` (~173, 221, 277, 324, 723, 817, 860)
- `internal/popup-menu/components/empty/empty.test.tsx` (~123, 263, 412, 484)

> Get the authoritative current list before editing:
> `rg -n "DataList" apps packages/react/src` and migrate every site whose
> `DataList` child is a function.

**Verify**: `bun run type-check` → exit 0 (all consumers migrated).

### Step 6: Add a test for `useDataList()`

In `deep-search/__tests__/data-list.test.tsx`, add a test that renders a child
component calling `useDataList()` (not a render-prop) and asserts it sees the
nodes. Model the menu tree on the existing helper in that file (around line 156):

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
// render <DropdownMenu.DataList><Items /></DropdownMenu.DataList> inside the
// standard Root/Portal/Positioner/Popup/DataSurface tree, then:
// expect(screen.getByTestId('count')).toHaveTextContent(String(expected))
```

Also add a negative test: calling `useDataList()` outside a `DataList` throws
`useDataList must be used within a DataList component`.

**Verify**:
`cd packages/react && bun run test src/internal/popup-menu/deep-search/__tests__/data-list.test.tsx`
→ all pass, including the new tests.

### Step 7: Changeset + full verification

Create `.changeset/<slug>.md`:

```md
---
"@bazza-ui/react": patch
---

Replace `DataList` children-as-function render prop with normal children and a
`useDataList()` hook. List content now lives in child components that call
`useDataList()`. This is a breaking change to the `DataList` API.
```

**Verify (all must pass)**:
- `bun run type-check` → exit 0
- `bun run test` → all pass
- `bun run check:fix` then `bun run check` → exit 0
- `bun run build` → exit 0

## Test plan

- New tests in `deep-search/__tests__/data-list.test.tsx`:
  - happy path: child component reads `nodes`/`count` via `useDataList()` and
    renders items (the regression this plan guards).
  - search: typing in `DataInput` updates the nodes the child sees (reuse the
    `userEvent.type(getByTestId('search-input'), ...)` pattern already in file).
  - error path: `useDataList()` outside `DataList` throws the documented message.
- Structural pattern to follow: the existing helper + `it(...)` blocks in
  `data-list.test.tsx` (render → `waitFor` → `screen.getByTestId` → assert).
- Verification: `cd packages/react && bun run test src/internal/popup-menu/deep-search/__tests__/data-list.test.tsx` → all pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run type-check` exits 0
- [ ] `bun run test` exits 0; new `useDataList` tests exist and pass
- [ ] `bun run check` exits 0
- [ ] `bun run build` exits 0
- [ ] `rg -n "children\(childrenState\)" packages/react/src/internal/popup-menu/deep-search/data-list.tsx` returns no matches
- [ ] `rg -n "DataList>\s*\n?\s*\{\s*\(" apps packages/react/src` returns no
      render-prop `DataList` usages (only static-children or migrated sites remain)
- [ ] `rg -n "useDataList" packages/react/src/dropdown-menu packages/react/src/context-menu` shows the hook re-exported in both entrypoints
- [ ] A changeset file targeting `"@bazza-ui/react": patch` exists in `.changeset/`
- [ ] `git status` shows no files modified outside the in-scope list
- [ ] This plan's row in `plans/README.md` updated

## STOP conditions

Stop and report (do not improvise) if:

- The code at `data-list.tsx` doesn't match the "Current state" excerpt (the
  `children(childrenState)` line is gone or different) — codebase drifted.
- A consumer's render-prop body uses fields **not** present on
  `DataListChildrenState`, implying it reads from a different scope.
- Migrating a consumer would require touching an out-of-scope file (e.g. the
  primitive `components/list/list.tsx`).
- `bun run build` fails in a way tied to registry JSON regeneration rather than
  to source changes.
- Any verification fails twice after a reasonable fix attempt.

## Maintenance notes

- Reviewer should confirm: no `DataList` site still passes a function child; the
  `DataListContext.Provider` wraps children **inside** `PopupMenuList` so
  `useDataList()` resolves; the hook is exported from both `dropdown-menu` and
  `context-menu`.
- Plan 002 deletes the `DataList` component and moves this context-provision into
  the primitive `List` running in "data mode". Keep `DataListContext` and the
  hooks; 002 reuses them.
- Bump level is `patch` per the stack's stated intent and pre-1.0 canary status.
  If the team decides pre-1.0 breaking changes warrant `minor`, change the
  changeset accordingly — flag in the PR description either way.
