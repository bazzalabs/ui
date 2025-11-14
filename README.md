<p align="center">
  <a href="https://ui.bazza.dev">
    <img src="https://github.com/kianbazza/ui/blob/main/assets/images/bazzaui-v3-color.png?raw=true" height="96" width="96">
    <h3 align="center">bazza/ui</h3>
  </a>
</p>

<p align="center">
  Hand-crafted, powerful, modern React components.
  <br />
  <b>Open source. Open code. Free to use.</b>
</p>

<p align="center">
  <a href="https://ui.bazza.dev/docs"><strong>Documentation</strong></a> ·
  <a href="https://ui.bazza.dev/contribute"><strong>Contribute</strong></a> ·
  <a href="https://ui.bazza.dev/contact"><strong>Contact Us</strong></a>
</p>
<br/>

## Documentation

For details on how to get started with `bazza/ui`, check out our [documentation](https://ui.bazza.dev/docs).

## Development Workflow

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

### Daily Development

When making changes to packages, document them with a changeset:

```bash
# Make your changes in packages/*
# Document the change
bun changeset
# Follow prompts to select package and change type (patch/minor/major)
# Commit changeset with your code
git commit -m "feat: new feature"
git push origin canary
```

### Release Types

| Type | Version Format | Tag | Stability | Use Case |
|------|---------------|-----|-----------|----------|
| **Stable** | `0.1.0` | `@latest` | Production-ready | Main branch releases |
| **Canary** | `0.1.1-canary.0` | `@canary` | Experimental but stable | Early adopters, next version preview |
| **Snapshot** | `0.1.1-snapshot-20251113` | `@snapshot` | Potentially unstable | Quick bug fix testing |

### Publishing Experimental Releases

**Canary releases** (experimental but stable):
```bash
# Use GitHub Actions → "Publish Experimental"
# Type: canary
# Packages: select package(s)
# Install: npm install @bazza-ui/action-menu@canary
```

**Snapshot releases** (quick testing):
```bash
# Use GitHub Actions → "Publish Experimental"
# Type: snapshot
# Packages: select package(s)
# Install: npm install @bazza-ui/action-menu@snapshot
```

### Stable Releases

When changes on `canary` are ready for stable release:

1. Create PR: `canary` → `main`
2. Merge PR
3. Changesets bot automatically creates "Version Packages" PR
4. Review CHANGELOG.md and version bumps in PR
5. Merge "Version Packages" PR → auto-publishes to npm with `@latest` tag
6. `bazza-ui.com` deploys from main with stable code

### Branch Structure

- `canary` (default) - All development happens here, deploys to `canary.bazza-ui.com`
- `main` - Stable releases only, deploys to `bazza-ui.com`

## Contributing

*Coming soon!*

## License

bazza/ui is licensed under the [MIT License](https://github.com/kianbazza/ui/blob/main/LICENSE.md).