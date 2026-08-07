# Ship config

## Linear team

**bazza/ui** (key `UI`, id `c750e0fc-8df6-45d1-8672-c7966c81e39b`)

States: Triage, Backlog, Icebox, Todo, In Progress, In Review, Canary, Reviewed, Done, Canceled, Duplicate.
Note: this team has a `Canary` state (merged to canary branch, published as canary release). Ship's "Done" transition happens at reconcile when work merges; use `Canary` for work merged to the canary trunk but not yet in a stable release.

## Toolchain

- Package manager: **bun** exclusively (never npm/yarn/pnpm/npx). Monorepo: Turborepo + bun workspaces.
- Lint/format: `bun run check` (check only) / `bun run check:fix` (Biome)
- Typecheck: `bun run type-check` (turbo; scope: `bun run type-check --filter <pkg>`)
- Build: `bun run build` (turbo; scope: `bun run build --filter <pkg>`)
- Test: `bun run test` (Vitest via turbo; scope: `bun run test --filter <pkg>`)
- Registry build: `bun run registry:build`
- Changesets: `bun run changeset` to add; publish scripts in root `package.json` (`ci:publish` lists packages explicitly — new publishable packages must be added there)
- No DB/migrations in this repo (demo DB for examples lives in `apps/web` with `drizzle.config.ts` + seed script when present)

## Reference repositories

None.

## Environment notes

- **Never run `bun run dev`** — assume the dev server is already running.
- Worktrees via worktrunk (`wt`); Graphite (`gt`) owns branches/commits/PRs. Trunks: `main` and `canary`; default branch for new work: **canary**.
- Worktree env files: `wt step copy-ignored` + root `.worktreeinclude` whitelist copy `.env` / `.env.local` (root and nested) into new worktrees via the `[pre-start]` hook in `.config/wt.toml`.
- New publishable packages live in `packages/<name>` (npm scope `@bazza-ui/<name>`); registry UI components live in `apps/web/registry/ui/<name>` (`@bazza-ui/registry-<name>`, private).
