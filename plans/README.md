# Implementation Plans — Unify Data-First Popup Menu API

Local, git-ignored implementation plans. Each plan follows the improve-skill
handoff template and is **self-contained**: an executor with zero context from
the authoring session needs only the single plan file + the repo. Read a plan
fully before starting, honor its STOP conditions, and update your row in the
status table below when done.

The data-first work ships as a Graphite stack (PR 1 → PR 2). Execute 001 fully —
including its verification gates — before starting 002. Plan 003 is an
**independent chore** (a Base UI version bump) that stacks on top of the same
in-flight work; it has no dependency on 001/002 beyond needing the
`packages/react` package to exist on the branch.

## Graphite stack

- Base branch: `ui-299-support-reset-scroll-on-search`
- PR 1 branch: `ui-300-replace-datalist-children-as-function-with-usedatalist-hook` → `001-*`
- PR 2 branch: `ui-301-unify-data-first-menu-api` → `002-*`
- PR 3 branch: `ui-303-bump-base-uireact-to-150` → `003-*` (stacks on the tip; `packages/react` is not on `main` yet)

Use `gt` for branch/commit/submit. Do **not** use `git commit` / `git push`.

## Execution order & status

| Plan | Title | Priority | Effort | Depends on | Status |
|------|-------|----------|--------|------------|--------|
| [001](./001-replace-datalist-render-prop-with-usedatalist-hook.md) | Replace `DataList` render-prop with `DataListContext` + `useDataList()` | P1 | M | — | DONE |
| [002](./002-unify-data-first-menu-api.md) | Fold data-first behavior into `Surface`/`List`/`Popup`; remove `Data*` exports | P1 | L | 001 | DONE |
| [003](./003-bump-base-ui-react-to-1.5.0.md) | Bump `@base-ui/react` to `1.5.0` (+ `@base-ui/utils` to `0.2.9`, align `apps/web`) | P2 | S | — (independent chore; UI-303) | DONE |
| [004](./004-align-listbox-controlled-state-with-base-ui-store-refactor.md) | Align `ListboxStore` controlled state with Base UI's `useControlledProp` refactor | P2 | M | 003 | DONE |
| [005](./005-replace-font-submodule-and-next-font-generation-with-hosted-css-fonts.md) | Replace font submodule and `next/font` generation with hosted CSS fonts | P1 | M | — | DONE |

Status values: TODO | IN PROGRESS | DONE | BLOCKED (one-line reason) | REJECTED (one-line rationale)

## Dependency notes

- 002 depends on 001 because 002 removes the `DataList` component and relies on
  the `DataListContext` + `useDataList()` hook introduced in 001 being the only
  way list children read node state. If 002 runs first, every consumer still
  uses the render-prop and must be migrated twice.
- 003 has **no logical dependency** on 001/002. It only needs `packages/react` to
  exist on the working branch (it does not exist on `main`), so in practice it
  stacks on the current tip. It can be executed before or after 001/002 land;
  if executed standalone after the stack merges to `main`, branch 003 from `main`.
- 004 depends on 003 because it assumes `@base-ui/utils@0.2.9` and the interim
  two-argument `useControlledProp` migration. It replaces 003's temporary
  `defaultSearch` compatibility shim with a store-owned controlled-state pattern.

## Shared facts (orientation — each plan re-inlines what its executor needs)

- **Monorepo**: Turborepo + bun workspaces. Package manager is **bun** only —
  never npm/yarn/pnpm/npx (`AGENTS.md`). Node >= 24.
- **Library package**: `@bazza-ui/react` at `packages/react` (version
  `0.1.0-canary.6`, `private: false`, published). Pre-1.0, changesets `pre`/canary state.
- **Primitives** live in `packages/react/src/internal/popup-menu/components/*`.
  **Data-first wrappers** live in `packages/react/src/internal/popup-menu/deep-search/*`.
- **Public entrypoints**: `packages/react/src/dropdown-menu/` and
  `packages/react/src/context-menu/` (each has `index.parts.ts` for short names
  like `DataList`, `index.ts` for prefixed names like `DropdownMenuDataList`).
  `combobox`/`select` expose primitives but **not** the `Data*` wrappers.
- **Tests**: Vitest (`packages/react/vitest.config.mts`, jsdom, globals, setup at
  `packages/react/test/setup.ts`), co-located + `internal/popup-menu/deep-search/__tests__/`.
  Tests import from the public entrypoint, e.g.
  `import { DropdownMenu } from '../../../../dropdown-menu/index.js'`.
- **Changeset format** (`.changeset/<adjective-noun-verb>.md`):
  ```md
  ---
  "@bazza-ui/react": patch
  ---

  One-line summary.
  ```
- **Planned at**: commit `78715af7`, 2026-06-13. (Plan 002 rebaselined to
  `d2a3a03e` during the 2026-06-13 reconcile; `78715af7` is no longer an ancestor
  of HEAD after a history rewrite, but in-scope `popup-menu` source is
  byte-identical between the two — `git diff 78715af7..HEAD` is empty for all
  in-scope dirs.)

## Commands (verified during recon — exact)

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck (all) | `bun run type-check` | exit 0, no errors |
| Test (all) | `bun run test` | all pass |
| Test (react only) | `cd packages/react && bun run test` | all pass |
| Test (single file) | `cd packages/react && bun run test <path-relative-to-packages/react>` | target passes |
| Lint + format (write) | `bun run check:fix` | exit 0 |
| Lint + format (check) | `bun run check` | exit 0 |
| Build (all) | `bun run build` | exit 0 |

> `bun run test` runs `turbo run test`; the react package script is `vitest run`.
> Extra positional args forwarded to `bun run test` are treated by vitest as
> filename filters. Do **not** run `bun run dev` (assume it is already running).

## Findings considered and rejected

- Keeping both plans in one combined `unify-data-first-menu-api.md`: rejected —
  split into per-plan files + this index per the handoff template's
  one-file-per-plan convention (operator request).
