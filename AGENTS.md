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

## Rules

- **Never run `bun run dev`** - assume the dev server is already running
- Check `package.json` scripts before running commands

## Releasing

```sh
bun run changeset     # Add a changeset
bun run ci:version    # Version packages
bun run ci:publish    # Publish to npm
```
