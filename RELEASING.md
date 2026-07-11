# Release Process

This repository uses a dual-branch strategy with [Changesets](https://github.com/changesets/changesets) for managing releases.

## Branch Strategy

### `main` Branch - Stable Releases

- **Purpose**: Production-ready stable releases
- **Versions**: Standard semver (e.g., `1.0.0`, `1.1.0`, `1.2.1`)
- **npm tag**: `latest` (default)
- **Pre-release mode**: Never in pre-release mode

### `canary` Branch - Pre-releases

- **Purpose**: Development releases for early testing
- **Versions**: Pre-release versions (e.g., `1.1.0-canary.0`, `1.1.0-canary.1`)
- **npm tag**: `canary`
- **Pre-release mode**: Always in pre-release mode

## Release Workflows

### Stable Release (main branch)

1. **Create a changeset** on your feature branch:
   ```bash
   bun changeset
   ```

2. **Merge your PR** into `main` with the changeset

3. **Changeset bot creates version PR**: The `Version Packages` workflow automatically creates a PR with version bumps

4. **Review and merge version PR**: Once merged, packages are automatically published to npm with the `latest` tag

**Workflows:**
- `.github/workflows/version-packages.yml` - Creates version PRs
- `.github/workflows/publish-stable.yml` - Publishes on merge

### Canary Release (canary branch)

1. **Create a changeset** on your feature branch:
   ```bash
   bun changeset
   ```

2. **Merge your PR** into `canary` with the changeset

3. **Changeset bot creates version PR**: The `Version Packages (Canary)` workflow automatically creates a PR with canary version bumps

4. **Review and merge version PR**: Once merged, packages are automatically published to npm with the `canary` tag

**Workflows:**
- `.github/workflows/version-packages-canary.yml` - Creates canary version PRs
- `.github/workflows/publish-canary.yml` - Publishes canary releases

**Installing canary releases:**
```bash
npm install @bazza-ui/filters@canary
npm install @bazza-ui/react@canary
```

### Snapshot Releases (any branch)

Snapshot releases are temporary testing versions that don't create git commits. Useful for quick PR testing.

1. **Go to GitHub Actions** → **Publish Snapshot Release** workflow

2. **Click "Run workflow"** and select:
   - **Packages**: Which package(s) to publish
   - **Branch**: Which branch to publish from (default: `canary`)

3. Packages are published with a temporary version like `0.0.0-snapshot-20231121143022`

**Workflow:**
- `.github/workflows/publish-snapshot.yml` - Manual snapshot releases

**Installing snapshot releases:**
```bash
npm install @bazza-ui/filters@snapshot
npm install @bazza-ui/react@snapshot
```

## Important Notes

### Branch Relationship

- **Never merge canary into main** - These are parallel release streams
- Features can be developed on either branch depending on stability
- Bug fixes can be cherry-picked from canary to main when needed

### Pre-release Mode

- **main branch**: Never has `.changeset/pre.json` file
- **canary branch**: Always has `.changeset/pre.json` with `{"mode": "pre", "tag": "canary"}`
- Pre-release mode is managed automatically by the workflows

### Changeset Best Practices

- Write clear, user-facing changelog entries
- Use appropriate bump types:
  - `patch`: Bug fixes, small improvements
  - `minor`: New features, non-breaking changes
  - `major`: Breaking changes
- One changeset per PR unless the PR addresses multiple concerns

## Manual Release Commands

If you need to release manually:

### Stable Release
```bash
# On main branch
bun run version-packages  # Updates versions
bun run release          # Builds and publishes with 'latest' tag
```

### Canary Release
```bash
# On canary branch (in pre-release mode)
bun run version-packages  # Updates canary versions
bun run release:canary   # Publishes with 'canary' tag
```

### Snapshot Release
```bash
# On any branch
bun changeset add        # Create changeset if needed
bun changeset version --snapshot snapshot  # Version with snapshot tag
bun run release:snapshot  # Publish with 'snapshot' tag
```

## Troubleshooting

### How to check if a branch is in pre-release mode

```bash
cat .changeset/pre.json
```

If the file exists and has `"mode": "pre"`, you're in pre-release mode.

### How to enter pre-release mode (canary branch only)

```bash
bun changeset pre enter canary
git add .changeset/pre.json
git commit -m "chore: enter pre-release mode"
```

### How to exit pre-release mode (should only happen on main)

```bash
bun changeset pre exit
bun changeset version  # Removes pre-release tags
git add .
git commit -m "chore: exit pre-release mode"
```

## npm Tags

| Tag | Branch | Purpose | Install Command |
|-----|--------|---------|----------------|
| `latest` | main | Stable production releases | `npm install @bazza-ui/package` |
| `canary` | canary | Pre-release development versions | `npm install @bazza-ui/package@canary` |
| `snapshot` | any | Temporary testing versions | `npm install @bazza-ui/package@snapshot` |
