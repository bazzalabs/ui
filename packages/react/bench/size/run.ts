/**
 * Bundle size of each menu family entry, checked against `budgets.json`.
 *
 *   bun run bench:size
 *
 * Each entry is bundled from its `src/<entry>/index.ts`, so the numbers follow
 * the code on the branch without a `dist` build. The bundle is minified ESM
 * with React external and every other dependency (@base-ui/*, @floating-ui/*)
 * bundled in, as an app ships it, then gzipped. Exits non-zero when an entry's
 * gzip size is over its budget. Raising a budget: "Bundle size" in
 * packages/react/AGENTS.md.
 */
import { appendFile } from 'node:fs/promises'

const SRC = new URL('../../src/', import.meta.url).pathname
const BUDGETS = new URL('./budgets.json', import.meta.url).pathname
const EXTERNAL = ['react', 'react-dom', 'react/jsx-runtime']
const ENTRIES = [
  'dropdown-menu',
  'context-menu',
  'command-menu',
  'suggestion-menu',
  'select',
  'combobox',
] as const

/** Gzip budget per entry, in bytes. */
const budgets: Record<string, number> = await Bun.file(BUDGETS).json()

interface Row {
  entry: string
  minified: number
  gzip: number
  budget: number | undefined
}

async function measure(entry: string): Promise<Row> {
  const build = await Bun.build({
    entrypoints: [`${SRC}${entry}/index.ts`],
    target: 'browser',
    format: 'esm',
    minify: true,
    external: EXTERNAL,
    define: { 'process.env.NODE_ENV': '"production"' },
    throw: false,
  })
  if (!build.success) {
    for (const log of build.logs) console.error(log)
    throw new Error(`${entry}: the build failed`)
  }
  const [output] = build.outputs
  if (!output) throw new Error(`${entry}: the build produced no output`)
  const bytes = new Uint8Array(await output.arrayBuffer())

  // Anything imported but not bundled. Only React may be.
  const code = new TextDecoder().decode(bytes)
  const unbundled = [
    ...code.matchAll(/(?:from|import)\s*["']([^"'./][^"']*)["']/g),
  ]
    .map((match) => match[1] ?? '')
    .filter((id) => !EXTERNAL.includes(id))
  if (unbundled.length > 0) {
    throw new Error(
      `${entry} imports ${[...new Set(unbundled)].join(', ')} unbundled`,
    )
  }

  return {
    entry,
    minified: bytes.byteLength,
    gzip: Bun.gzipSync(bytes, { level: 9 }).byteLength,
    budget: budgets[entry],
  }
}

const rows: Row[] = []
for (const entry of ENTRIES) rows.push(await measure(entry))

const kb = (bytes: number) => `${(bytes / 1000).toFixed(2)} kB`
const delta = (row: Row) => {
  if (row.budget === undefined) return 'no budget'
  const diff = row.gzip - row.budget
  const percent = ((diff / row.budget) * 100).toFixed(1)
  return `${diff > 0 ? '+' : ''}${diff} B (${diff > 0 ? '+' : ''}${percent}%)`
}
const over = rows.filter(
  (row) => row.budget === undefined || row.gzip > row.budget,
)

console.log('Minified ESM, React external, dependencies bundled, gzip -9:')
console.table(
  rows.map((row) => ({
    entry: row.entry,
    minified: kb(row.minified),
    gzip: kb(row.gzip),
    'gzip (B)': row.gzip,
    'budget (B)': row.budget ?? '-',
    delta: delta(row),
  })),
)

const summaryPath = process.env.GITHUB_STEP_SUMMARY
if (summaryPath) {
  const lines = [
    '## Menu family bundle size',
    '',
    'Minified ESM, React external, dependencies bundled, gzip -9. Delta is gzip minus budget.',
    '',
    '| Entry | Minified | Gzip | Budget | Delta |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...rows.map(
      (row) =>
        `| ${over.includes(row) ? '❌' : '✅'} \`${row.entry}\` | ${kb(row.minified)} | ${kb(row.gzip)} (${row.gzip} B) | ${row.budget === undefined ? '-' : `${kb(row.budget)} (${row.budget} B)`} | ${delta(row)} |`,
    ),
    '',
  ]
  await appendFile(summaryPath, `${lines.join('\n')}\n`)
}

if (over.length > 0) {
  console.error(
    `\nOver budget: ${over
      .map((row) =>
        row.budget === undefined
          ? `${row.entry} has no budget in bench/size/budgets.json`
          : `${row.entry} gzips to ${row.gzip} B, ${row.gzip - row.budget} B over its ${row.budget} B budget`,
      )
      .join('; ')}.\n` +
      'Shrink the entry, or raise its budget deliberately: see "Bundle size" in packages/react/AGENTS.md.',
  )
  process.exit(1)
}
