/**
 * Packages the built `dist` imports, checked against what `@bazza-ui/react`
 * declares.
 *
 *   bun run build && bun run bench:dist-imports
 *
 * `bench:size` bundles from `src`, where a workspace package resolves whether
 * or not tsdown inlines it. This checks what's published: every package a
 * `dist` file imports must be a dependency or peer dependency, so nothing
 * private (a workspace package tsdown should have bundled) leaks into it.
 */
import { Glob } from 'bun'

const ROOT = new URL('../../', import.meta.url).pathname
const pkg = await Bun.file(`${ROOT}package.json`).json()
const declared = new Set<string>([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
])

/** `@scope/name/sub` → `@scope/name`, `name/sub` → `name`. */
function packageName(specifier: string): string {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]!
}

const SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)["']([^"'.][^"']*)["']/g

const undeclared = new Map<string, Set<string>>()
let files = 0
for await (const file of new Glob(
  'dist/**/*.{js,cjs,mjs,d.ts,d.cts,d.mts}',
).scan(ROOT)) {
  files++
  const code = await Bun.file(`${ROOT}${file}`).text()
  for (const match of code.matchAll(SPECIFIER)) {
    const specifier = match[1] ?? ''
    if (specifier.startsWith('node:')) continue
    const name = packageName(specifier)
    if (declared.has(name)) continue
    const seen = undeclared.get(name) ?? new Set<string>()
    seen.add(file)
    undeclared.set(name, seen)
  }
}

if (files === 0) {
  console.error('No files in dist. Run `bun run build` first.')
  process.exit(1)
}

if (undeclared.size > 0) {
  for (const [name, seen] of undeclared) {
    console.error(
      `dist imports ${name}, which @bazza-ui/react doesn't declare: ${[...seen].join(', ')}`,
    )
  }
  console.error(
    'Bundle it into dist (tsdown `noExternal`), or declare it as a dependency.',
  )
  process.exit(1)
}

console.log(
  `${files} dist files import only declared packages: ${[...declared].sort().join(', ')}`,
)
