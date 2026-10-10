/**
 * Measures how long a menu takes to respond to each keystroke in its search
 * input, from `keydown` to the next paint, in a production build in Chromium.
 *
 *   bun run bench:browser -- --rows=1000,3000 --modes=jsx,data --throttle=1,4 --loops=10
 */
import { chromium, type Page } from 'playwright'

interface Sample {
  key: string
  ms: number
  rows: number
}

declare global {
  interface Window {
    __samples: Sample[]
    __lateMutations: string[]
    __benchReadyAt?: number
  }
}

type RowChange = 'all' | 'fewer' | 'more'

interface Phase {
  name: string
  keys: string[]
  /** What every key in the phase must do to the number of rows shown. */
  rows: RowChange
  /** The input's value once the phase ends. */
  value: string
}

// "label" matches every row, so the time is all re-rendering. Every digit of
// "123" hides rows and every Backspace after it shows rows again, so rows
// also unmount and mount.
const PHASES: Phase[] = [
  {
    name: 'type, all rows match',
    keys: [...'label'],
    rows: 'all',
    value: 'label',
  },
  {
    name: 'delete, all rows match',
    keys: Array(5).fill('Backspace'),
    rows: 'all',
    value: '',
  },
  { name: 'type, list narrows', keys: [...'123'], rows: 'fewer', value: '123' },
  {
    name: 'delete, list widens',
    keys: Array(3).fill('Backspace'),
    rows: 'more',
    value: '',
  },
]

const WARMUP_LOOPS = 2
// Rows 1, 2, and 12 make every key of "123" change the row count: "1" hides
// row 2, "12" hides row 1, and "123" hides row 12.
const MIN_ROWS = 12
const MODES = ['jsx', 'data']

function readArg(name: string, fallback: string): string[] {
  const arg = process.argv.find((value) => value.startsWith(`--${name}=`))
  return (arg?.slice(name.length + 3) ?? fallback).split(',')
}

function readNumbers(name: string, fallback: string, min: number): number[] {
  return readArg(name, fallback).map((value) => {
    const number = Number(value)
    if (!Number.isInteger(number) || number < min) {
      throw new Error(
        `--${name} takes integers of at least ${min}, got "${value}"`,
      )
    }
    return number
  })
}

const rowCounts = readNumbers('rows', '1000', MIN_ROWS)
const throttles = readNumbers('throttle', '1,4', 1)
const [loops = 10] = readNumbers('loops', '10', 1)
const modes = readArg('modes', MODES.join(','))
for (const mode of modes) {
  if (!MODES.includes(mode)) {
    throw new Error(`--modes takes ${MODES.join(' or ')}, got "${mode}"`)
  }
}
const perKey = process.argv.includes('--per-key')

const build = await Bun.build({
  entrypoints: [new URL('./app.tsx', import.meta.url).pathname],
  target: 'browser',
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
})
if (!build.success) {
  for (const log of build.logs) console.error(log)
  process.exit(1)
}
const [bundle] = build.outputs
if (!bundle) throw new Error('The build produced no output')
const script = await bundle.text()
// Production React minifies its errors and drops its dev-only warnings.
if (
  !script.includes('Minified React error') ||
  script.includes('unique "key" prop')
) {
  throw new Error('The bundle does not use the production build of React')
}

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font: 14px system-ui, sans-serif; margin: 0; }
      .popup { width: 280px; background: white; border: 1px solid #ddd; }
      .input { width: 100%; box-sizing: border-box; padding: 8px; }
      .list { max-height: 480px; overflow: auto; }
      .row { display: flex; gap: 8px; align-items: center; padding: 4px 8px; }
      .row[data-highlighted] { background: #eee; }
      .dot { width: 8px; height: 8px; border-radius: 50%; background: #888; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/app.js"></script>
  </body>
</html>`

const server = Bun.serve({
  port: 0,
  fetch(request) {
    const { pathname } = new URL(request.url)
    if (pathname === '/app.js') {
      return new Response(script, {
        headers: { 'content-type': 'text/javascript' },
      })
    }
    return new Response(html, { headers: { 'content-type': 'text/html' } })
  },
})

// Time from the keydown to the end of the next frame's main-thread work: a
// task posted from a requestAnimationFrame callback runs after that frame's
// style, layout, and paint. From then on, any DOM change counts as late work.
function installKeystrokeTimer() {
  window.__samples = []
  window.__lateMutations = []
  const describe = (node: Node) =>
    node instanceof Element
      ? `<${node.tagName.toLowerCase()}${node.id ? ` id="${node.id}"` : ''}${node.getAttribute('role') ? ` role="${node.getAttribute('role')}"` : ''}>`
      : node.nodeName
  const lateWork = new MutationObserver((records) => {
    for (const record of records) {
      // Live regions update on timers of their own, not from rendering.
      const target =
        record.target instanceof Element
          ? record.target
          : record.target.parentElement
      if (target?.closest('[aria-live]')) continue
      window.__lateMutations.push(
        `after key "${observedKey}", ${record.type}${record.attributeName ? ` ${record.attributeName}` : ''} in ${describe(record.target)}: +${[...record.addedNodes].map(describe).join(',')} -${[...record.removedNodes].map(describe).join(',')}`,
      )
    }
  })
  let observedKey = ''
  window.addEventListener(
    'keydown',
    (event) => {
      lateWork.disconnect()
      const start = event.timeStamp
      requestAnimationFrame(() => {
        const channel = new MessageChannel()
        channel.port1.onmessage = () => {
          const ms = performance.now() - start
          window.__samples.push({
            key: event.key,
            ms,
            rows: document.querySelectorAll('[role="option"]').length,
          })
          observedKey = event.key
          // Row and highlight changes only: positioning writes `style`
          // after layout on its own schedule.
          lateWork.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributeFilter: [
              'data-highlighted',
              'aria-selected',
              'aria-activedescendant',
              'hidden',
            ],
          })
        }
        channel.port2.postMessage(null)
      })
    },
    true,
  )
}

// Wait until the main thread is idle, so leftover work can't land in the
// next key's time, then check nothing in the page changed after the last
// sample. The fixed pause after it keeps the next key from landing right at
// the start of an idle period, which delays its frame and adds up to a frame
// of noise to the sample.
async function settleAndCheckLateWork(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestIdleCallback(() => resolve(), { timeout: 10_000 })
      }),
  )
  await page.waitForTimeout(50)
  const lateMutations = await page.evaluate(() => window.__lateMutations)
  if (lateMutations.length > 0) {
    throw new Error(
      `The page changed after the measured paint, so the measurement missed deferred work. First change: ${lateMutations[0]}`,
    )
  }
}

async function pressAndMeasure(page: Page, key: string): Promise<Sample> {
  const count = await page.evaluate(() => window.__samples.length)
  await page.keyboard.press(key)
  await page.waitForFunction(
    (previous) => window.__samples.length > previous,
    count,
  )
  await settleAndCheckLateWork(page)
  const sample = await page.evaluate(() => window.__samples.at(-1))
  if (!sample) throw new Error('No sample was recorded')
  return sample
}

function checkRows(
  change: RowChange,
  before: number,
  after: number,
  total: number,
) {
  const ok =
    change === 'all'
      ? after === total
      : change === 'fewer'
        ? after < before
        : after > before
  if (!ok) {
    throw new Error(
      `Expected ${change === 'all' ? `all ${total}` : change} rows, went from ${before} to ${after}`,
    )
  }
}

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1,
  )
  return sorted[Math.max(0, index)] ?? Number.NaN
}

function append<V>(map: Map<string, V[]>, key: string, value: V) {
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}

interface Result {
  rows: number
  mode: string
  throttle: string
  phase: string
  p50: string
  p95: string
  max: string
}

const results: Result[] = []
const mounts: Record<string, string>[] = []
const browser = await chromium.launch()

try {
  for (const rows of rowCounts) {
    for (const throttle of throttles) {
      for (const mode of modes) {
        const label = `${rows} rows, ${mode}, ${throttle}× throttle`
        const page = await browser.newPage()
        const cdp = await page.context().newCDPSession(page)
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle })
        await page.addInitScript(installKeystrokeTimer)

        await page.goto(`${server.url}?mode=${mode}&rows=${rows}`)
        await page.waitForFunction(
          () => window.__benchReadyAt !== undefined,
          null,
          { timeout: 120_000 },
        )
        const readyAt = await page.evaluate(() => window.__benchReadyAt ?? 0)
        mounts.push({
          rows: String(rows),
          mode,
          throttle: `${throttle}×`,
          'menu ready (ms)': readyAt.toFixed(0),
        })

        const input = page.locator('input')
        await input.click()
        let rowsShown = await page.locator('[role="option"]').count()
        if (rowsShown !== rows) {
          throw new Error(`Expected ${rows} rows, found ${rowsShown}`)
        }

        const samples = new Map<string, number[]>()
        const keySamples = new Map<string, Sample[]>()
        for (let loop = 0; loop < WARMUP_LOOPS + loops; loop++) {
          for (const phase of PHASES) {
            for (const [index, key] of phase.keys.entries()) {
              const sample = await pressAndMeasure(page, key)
              checkRows(phase.rows, rowsShown, sample.rows, rows)
              rowsShown = sample.rows
              if (loop < WARMUP_LOOPS) continue
              append(samples, phase.name, sample.ms)
              append(keySamples, `${phase.name} #${index + 1} ${key}`, sample)
            }
            const value = await input.inputValue()
            if (value !== phase.value) {
              throw new Error(
                `After "${phase.name}" the input holds "${value}", expected "${phase.value}"`,
              )
            }
          }
        }

        if (perKey) {
          console.log(`\n${label}:`)
          console.table(
            [...keySamples].map(([keyId, list]) => ({
              key: keyId,
              'rows after': list[0]?.rows,
              p50: percentile(
                list.map((sample) => sample.ms),
                50,
              ).toFixed(1),
            })),
          )
        }

        // Late work from the last key surfaces here, after its check ran.
        await settleAndCheckLateWork(page)
        console.error(`done: ${label}`)
        for (const phase of PHASES) {
          const values = samples.get(phase.name) ?? []
          results.push({
            rows,
            mode,
            throttle: `${throttle}×`,
            phase: phase.name,
            p50: percentile(values, 50).toFixed(1),
            p95: percentile(values, 95).toFixed(1),
            max: Math.max(...values).toFixed(1),
          })
        }
        await page.close()
      }
    }
  }
} finally {
  await browser.close()
  server.stop()
}

console.log('\nTime from navigation to the menu mounting, including page load:')
console.table(mounts)
console.log(
  `\nKeystroke to next paint, in ms (${loops} loops after ${WARMUP_LOOPS} warmup):`,
)
console.table(results)
