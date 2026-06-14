# Implementation Plans — Unify Data-First Popup Menu API

Local, git-ignored implementation plans. Each plan follows the improve-skill
handoff template and is **self-contained**: an executor with zero context from
the authoring session needs only the single plan file + the repo. Read a plan
fully before starting, honor its STOP conditions, and update your row in the
status table below when done.

The work ships as a Graphite stack (PR 1 → PR 2). Execute 001 fully — including
its verification gates — before starting 002.

## Graphite stack

- Base branch: `ui-299-support-reset-scroll-on-search`
- PR 1 branch: `ui-300-replace-datalist-children-as-function-with-usedatalist-hook` → `001-*`
- PR 2 branch: `ui-301-unify-data-first-menu-api` → `002-*`

Use `gt` for branch/commit/submit. Do **not** use `git commit` / `git push`.

## Execution order & status

| Plan | Title | Priority | Effort | Depends on | Status |
|------|-------|----------|--------|------------|--------|
| [001](./001-replace-datalist-render-prop-with-usedatalist-hook.md) | Replace `DataList` render-prop with `DataListContext` + `useDataList()` | P1 | M | — | DONE |
| [002](./002-unify-data-first-menu-api.md) | Fold data-first behavior into `Surface`/`List`/`Popup`; remove `Data*` exports | P1 | L | 001 | DONE |

Status values: TODO | IN PROGRESS | DONE | BLOCKED (one-line reason) | REJECTED (one-line rationale)

## Dependency notes

- 002 depends on 001 because 002 removes the `DataList` component and relies on
  the `DataListContext` + `useDataList()` hook introduced in 001 being the only
  way list children read node state. If 002 runs first, every consumer still
  uses the render-prop and must be migrated twice.

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
