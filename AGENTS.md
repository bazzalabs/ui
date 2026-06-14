# @bazza-ui

React component library monorepo (Turborepo + Bun workspaces).

## Package Manager

Use **bun** exclusively. Never use npm/yarn/pnpm/npx.

## Commands

```sh
bun run type-check    # TypeScript check
bun run test          # Run tests (Vitest)
bun run build         # Build all packages
bun run check:fix     # Lint + format (Biome)
```

## Worktrees

Use **worktrunk** (`wt`) directly. The old `bun run wt` wrapper does not exist.

```sh
wt config state default-branch set canary  # One-time local setup
wt switch -c <branch>                      # Create a branch/worktree from canary
wt switch -c <branch> -b @                 # Create from the current HEAD
wt list                                    # List worktrees, status, and portless URLs
wt remove <branch> --no-delete-branch      # Remove worktree; let Graphite own branches
wt release stable|canary|rc                # Set NEXT_PUBLIC_RELEASE_TYPE for this worktree
```

New worktrees use worktrunk's default sibling layout (`../ui.<branch>`). Portless
detects the worktree and serves the web app at
`https://ui.<branch>.bazza-ui.localhost`.

Project hooks in `.config/wt.toml` copy `.env.local` files from the primary
worktree and run `bun install` when a worktree is created. On first use, approve
the project hooks when prompted, or pre-approve them with `wt config approvals add`.
Install shell integration with `wt config shell install` if `wt switch` should
change the current shell directory.

## Graphite Stacks

This repo uses **Graphite** (`gt`) for stacked branches and pull requests.
Worktrunk manages directories; Graphite manages branch/commit/stack state.

- Treat one worktree as one independent Graphite stack. Do not spread branches
  from the same stack across multiple worktrees.
- Use `gt create` for commits/branches and `gt submit --stack` when the operator
  asks to submit. Never use `git commit`, `git push`, or `wt merge` for stacked
  work.
- Branches created by `wt switch -c` are plain git branches until adopted with
  `gt track --parent canary` or used as the base for `gt create`.
- To stack on a branch that is checked out in another worktree, use
  `gt create --onto <branch>` instead of checking that branch out here.
- Remove worktrees with `wt remove <branch> --no-delete-branch`; use `gt sync`
  after PRs merge so Graphite prunes merged branches.
- Graphite trunks are `main` and `canary`. New worktrees should default to
  `canary`; if not, run `wt config state default-branch set canary`.

## Rules

- **Never run `bun run dev`** - assume the dev server is already running
- Check `package.json` scripts before running commands

## Releasing

```sh
bun run changeset     # Add a changeset
bun run ci:version    # Version packages
bun run ci:publish    # Publish to npm
```
