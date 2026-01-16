# Package Manager

**ALWAYS use Bun as the package manager for this project. Never use npm, yarn, pnpm, or npx.**

- Use `bun install` instead of `npm install` / `yarn` / `pnpm install`
- Use `bun add <package>` instead of `npm install <package>`
- Use `bun add -d <package>` for dev dependencies
- Use `bun remove <package>` instead of `npm uninstall`
- Use `bunx` instead of `npx`
- Use `bun run <script>` instead of `npm run <script>`
- Use `bun test` for testing

Before running any command, check `package.json` for existing scripts and use them via `bun run <script-name>`.

## Development Commands

**NEVER run `bun run dev` or any dev server commands.** Assume the user already has the dev server running in the background.

- Install dependencies: `bun install`
- Run tests: `bun run test`
- Run tests in watch mode: `bun run test:watch`
- Type check: `bun run type-check`
- Build: `bun run build`
- Start production: `bun run start`

## Code Quality

- Lint check: `bun run check`
- Lint fix: `bun run check:fix`
- Format check: `bun run format`
- Format fix: `bun run format:fix`

This project uses Biome for linting and formatting.

## Monorepo Structure

This is a Turborepo monorepo with Bun workspaces.

### Apps
- `apps/web` - Documentation website (Next.js)
- `apps/playground-nextjs` - Next.js playground for testing components

### Packages
- `packages/react` - Main React component library (`@bazza-ui/react`)
- `packages/filters` - Filter components
- `packages/select` - Select component
- `packages/menu` - Menu components
- `packages/dropdown-menu` - Dropdown menu component
- `packages/context-menu` - Context menu component
- `packages/action-menu` - Action menu component
- `packages/command-menu` - Command menu component
- `packages/popup-menu` - Popup menu component
- `packages/loaders` - Loading components
- `packages/theming` - Theming utilities
- `packages/typescript-config` - Shared TypeScript configuration

## Filtering Turbo Tasks

Run commands for specific packages using Turbo filters:
- `bun run dev --filter=@bazza-ui/react` - Dev only the react package
- `bun run dev:react` - Dev react package + web app with tests

Note: These are for reference only. Assume the dev server is already running.

## Changesets

- Add a changeset: `bun run changeset`
- Version packages: `bun run ci:version`
- Publish packages: `bun run ci:publish`

## Testing

Tests use Vitest. Each package has its own test setup:
- `bun run test` - Run all tests once
- `bun run test:watch` - Run tests in watch mode
- `bun run bench` - Run benchmarks
- `bun run bench:watch` - Run benchmarks in watch mode
