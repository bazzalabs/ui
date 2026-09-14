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
wt remove <branch> --no-delete-branch      # Remove worktree; let gh stack own branches
wt release stable|canary|rc                # Set NEXT_PUBLIC_RELEASE_TYPE for this worktree
```

New worktrees use worktrunk's default sibling layout (`../ui.<branch>`). Portless
serves the web app at `https://<last-branch-segment>.bazza-ui.localhost` (the
trunk worktree serves at `https://bazza-ui.localhost`). The URL follows the
checked-out branch, so it changes when gh stack switches branches in a
worktree — run `portless list` for live routes or `wt list` for expected URLs.

Project hooks in `.config/wt.toml` run `wt step copy-ignored` (copying the
gitignored env files whitelisted in the root `.worktreeinclude`) and
`bun install` when a worktree is created. On first use, approve
the project hooks when prompted, or pre-approve them with `wt config approvals add`.
Install shell integration with `wt config shell install` if `wt switch` should
change the current shell directory.

## GitHub Stacks

This repo uses **GitHub stacks** (`gh stack`, the `github/gh-stack` CLI
extension) for stacked branches and pull requests. Worktrunk manages
directories; `gh stack` manages branch/stack/PR state.

- Treat one worktree as one independent stack. Do not spread branches from the
  same stack across multiple worktrees.
- Always use the non-interactive forms: `gh stack init --base canary <branch>`,
  `gh stack add -Am "<title>" [<branch>]`, `gh stack submit --auto`,
  `gh stack view --json`. Bare `gh stack view` / `submit` / `modify` open TUIs
  and block.
- Commit with plain `git commit` **on a stack branch only** — one commit per
  branch, subject in conventional-commit form. Never commit on `canary` or
  `main`. Never `git push` or `gh pr create`; `gh stack submit` / `gh stack
  push` are the only push paths.
- Branches created by `wt switch -c` are plain git branches until adopted with
  `gh stack init --base canary <branch>` or created via `gh stack add`.
- To stack on a branch that is checked out in another worktree, run
  `gh stack checkout <branch>` in this worktree first (it pulls the stack
  definition from GitHub), then `gh stack add`.
- Remove worktrees with `wt remove <branch> --no-delete-branch`; use
  `gh stack sync --prune` after PRs merge so merged branches are dropped.
- Legacy stacks built with Graphite (`gt`) must be adopted with
  `gh stack init --base canary <branch-1> <branch-2> ...` before further work.
  Never mix `gt` and `gh stack` on the same stack.
- Trunks are `main` and `canary`. New worktrees should default to `canary`; if
  not, run `wt config state default-branch set canary`.

## Rules

- **Never run `bun run dev`** - assume the dev server is already running
- Check `package.json` scripts before running commands

## Releasing

```sh
bun run changeset     # Add a changeset
bun run ci:version    # Version packages
bun run ci:publish    # Publish to npm
```
