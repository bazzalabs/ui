import { act, render } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ItemDef, NodeDef } from '../internal/popup-menu/index.js'
import { createVanillaQueryLoader } from '../loaders/vanilla.js'
import { SuggestionMenu } from './index.js'

// The results summary waits for the menu's loaders to settle for the query
// (`isTreeSettled`), and reports the rows and highlight the List published.

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

const item = (value: string): ItemDef => ({
  kind: 'item',
  value,
  render: ({ props }) => (
    <SuggestionMenu.Item {...props}>{value}</SuggestionMenu.Item>
  ),
})

async function step(ms = 0) {
  await act(async () => {
    vi.advanceTimersByTime(ms)
    await Promise.resolve()
  })
  await act(async () => {
    await Promise.resolve()
  })
}

function setup(options: { debounce?: number; keepPreviousData?: boolean }) {
  const pending = new Map<string, (rows: NodeDef[]) => void>()
  const loader = createVanillaQueryLoader({
    fetcher: (query) =>
      new Promise<NodeDef[]>((resolve) => pending.set(query, resolve)),
    minQueryLength: 0,
    ...options,
  })
  const reports: string[] = []
  const menu = SuggestionMenu.createHandle()
  render(
    <>
      <textarea
        ref={(el) => {
          if (el) menu.attach(el)
        }}
      />
      <SuggestionMenu.Root
        handle={menu}
        getAriaResultsText={(count, label) => {
          reports.push(`${count}:${label}`)
          return `${count}`
        }}
      >
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup>
              <SuggestionMenu.Surface content={[]} asyncContent={loader}>
                <SuggestionMenu.List>
                  <Rows />
                </SuggestionMenu.List>
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    </>,
  )
  return {
    reports,
    search: (query: string) =>
      act(async () => {
        menu.update({ query })
      }),
    answer: async (query: string, rows: string[]) => {
      await act(async () => {
        pending.get(query)?.(rows.map(item))
      })
      await step()
    },
  }
}

/** Holds the root reveal back with `setRootReveal` while `hold` is set. */
function Holder({ hold }: { hold: boolean }) {
  const coordinator = SuggestionMenu.useAsyncMenuCoordinator()
  const setRootReveal = coordinator?.setRootReveal
  React.useLayoutEffect(() => {
    setRootReveal?.({ settled: !hold, settledOnce: true, block: false })
  }, [setRootReveal, hold])
  return null
}

describe('SuggestionMenu results summary', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  for (const options of [
    {},
    { debounce: 80 },
    { keepPreviousData: true },
    { keepPreviousData: true, debounce: 80 },
  ]) {
    it(`reports each query once it settles, with its rows (${JSON.stringify(options)})`, async () => {
      const menu = setup(options)
      await menu.search('')
      await step()
      expect(menu.reports).toEqual([])
      await menu.answer('', ['Alice', 'Bob'])
      expect(menu.reports).toEqual(['2:Alice'])

      await menu.search('a')
      await step(options.debounce ?? 0)
      // Asked, not answered: nothing new to say.
      expect(menu.reports).toEqual(['2:Alice'])
      await menu.answer('a', ['Ada'])
      expect(menu.reports).toEqual(['2:Alice', '1:Ada'])

      await menu.search('zz')
      await step(options.debounce ?? 0)
      await menu.answer('zz', [])
      expect(menu.reports).toEqual(['2:Alice', '1:Ada', '0:null'])
    })
  }

  it("waits while a consumer's setRootReveal holds the reveal back", async () => {
    const reports: string[] = []
    const menu = SuggestionMenu.createHandle()
    const view = (hold: boolean) => (
      <>
        <textarea
          ref={(el) => {
            if (el) menu.attach(el)
          }}
        />
        <SuggestionMenu.Root
          handle={menu}
          getAriaResultsText={(count, label) => {
            reports.push(`${count}:${label}`)
            return `${count}`
          }}
        >
          <SuggestionMenu.Portal>
            <SuggestionMenu.Positioner>
              <SuggestionMenu.Popup>
                <SuggestionMenu.Surface content={[item('Alice'), item('Bob')]}>
                  <SuggestionMenu.List>
                    <Rows />
                  </SuggestionMenu.List>
                  <Holder hold={hold} />
                </SuggestionMenu.Surface>
              </SuggestionMenu.Popup>
            </SuggestionMenu.Positioner>
          </SuggestionMenu.Portal>
        </SuggestionMenu.Root>
      </>
    )
    const { rerender } = render(view(true))
    await act(async () => {
      menu.update({ query: '' })
    })
    await step()
    await act(async () => {
      menu.update({ query: 'b' })
    })
    await step()
    expect(reports).toEqual([])

    rerender(view(false))
    await step()
    expect(reports).toEqual(['1:Bob'])
  })
})
