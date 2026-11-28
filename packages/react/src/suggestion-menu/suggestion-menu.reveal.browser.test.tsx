import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ItemDef, NodeDef } from '../internal/popup-menu/index.js'
import { createVanillaQueryLoader } from '../loaders/vanilla.js'
import { SuggestionMenu } from './index.js'

// The results summary is reported once the menu's loaders have settled for
// the query (`isTreeSettled`), with the rows and the highlight the List has
// published. Here the loader answers on real timers, racing React's commits.

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

const item = (value: string): ItemDef => ({
  kind: 'item',
  value,
  render: ({ props }) => (
    <SuggestionMenu.Item {...props} data-row="">
      {value}
    </SuggestionMenu.Item>
  ),
})

const ROWS: Record<string, string[]> = {
  '': ['Alice', 'Bob', 'Carla'],
  a: ['Alice', 'Carla'],
  al: ['Alice'],
  zz: [],
}

interface Report {
  count: number
  label: string | null
  /** The rows and the highlighted one on the page when it was reported. */
  shown: string[]
  highlighted: string | null
}

describe('SuggestionMenu results summary in the browser', () => {
  for (const debounce of [0, 150]) {
    it(`reports each query once, with the rows it shows (debounce ${debounce})`, async () => {
      const reports: Report[] = []
      const loader = createVanillaQueryLoader({
        fetcher: async (query) => {
          await new Promise((resolve) => setTimeout(resolve, 40))
          return (ROWS[query] ?? []).map(item) as NodeDef[]
        },
        minQueryLength: 0,
        debounce,
      })
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
              const rows = [...document.querySelectorAll('[data-row]')]
              reports.push({
                count,
                label,
                shown: rows.map((row) => row.textContent ?? ''),
                highlighted:
                  rows.find((row) => row.hasAttribute('data-highlighted'))
                    ?.textContent ?? null,
              })
              return `${count}`
            }}
          >
            <SuggestionMenu.Portal>
              <SuggestionMenu.Positioner>
                <SuggestionMenu.Popup style={{ width: 160 }}>
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

      for (const query of ['', 'a', 'al', 'zz']) {
        const before = reports.length
        await act(async () => {
          menu.update({ query })
        })
        await vi.waitFor(() => expect(reports.length).toBe(before + 1), {
          timeout: 2000,
        })
        // Nothing more for this query once it has settled.
        await new Promise((resolve) => setTimeout(resolve, debounce + 120))
        expect(reports.length).toBe(before + 1)
        const report = reports[before]!
        const expected = ROWS[query]!
        expect(report).toEqual({
          count: expected.length,
          label: expected[0] ?? null,
          shown: expected,
          highlighted: expected[0] ?? null,
        })
      }
    })
  }
})
