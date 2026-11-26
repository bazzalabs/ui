import { act, render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { ItemDef } from '../internal/popup-menu/index.js'
import { SuggestionMenu } from './index.js'

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

const item = (value: string): ItemDef => ({
  kind: 'item',
  value,
  render: ({ props }) => (
    <SuggestionMenu.Item {...props} data-testid={value}>
      {value}
    </SuggestionMenu.Item>
  ),
})

function setup(
  positionerProps: SuggestionMenu.Positioner.Props = {},
  options: { keepMounted?: boolean; strict?: boolean } = {},
) {
  const menu = SuggestionMenu.createHandle()
  const sides: string[] = []
  const aligns: string[] = []
  const Wrapper = options.strict ? React.StrictMode : React.Fragment
  render(
    <Wrapper>
      <textarea
        data-testid="host"
        ref={(el) => {
          if (el) menu.attach(el)
        }}
      />
      <SuggestionMenu.Root handle={menu}>
        <SuggestionMenu.Portal keepMounted={options.keepMounted}>
          <SuggestionMenu.Positioner
            data-testid="positioner"
            className={(state) => {
              sides.push(state.side)
              aligns.push(state.align)
              return ''
            }}
            {...positionerProps}
          >
            <SuggestionMenu.Popup>
              <SuggestionMenu.Surface
                content={[item('Alice'), item('Bob'), item('Carol')]}
              >
                <SuggestionMenu.List>
                  <Rows />
                </SuggestionMenu.List>
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    </Wrapper>,
  )
  return {
    menu,
    host: screen.getByTestId('host'),
    side: () => sides.at(-1),
    align: () => aligns.at(-1),
  }
}

const rect = (x: number, y: number) => new DOMRect(x, y, 0, 16)

// jsdom's viewport measures 0×0, which makes every placement overflow.
const viewport = { clientWidth: 1024, clientHeight: 768 }
const originals = new Map<string, PropertyDescriptor | undefined>()
beforeAll(() => {
  for (const [key, value] of Object.entries(viewport)) {
    originals.set(
      key,
      Object.getOwnPropertyDescriptor(document.documentElement, key),
    )
    Object.defineProperty(document.documentElement, key, {
      configurable: true,
      value,
    })
  }
})
afterAll(() => {
  for (const [key, descriptor] of originals) {
    if (descriptor) {
      Object.defineProperty(document.documentElement, key, descriptor)
    } else {
      delete (document.documentElement as unknown as Record<string, unknown>)[
        key
      ]
    }
  }
})

// Where the popup lands against the anchor is covered in
// suggestion-menu.anchor.browser.test.tsx.
describe('SuggestionMenu anchor', () => {
  it("doesn't measure on renders that aren't updates", async () => {
    const { menu, host } = setup()
    let calls = 0
    const measure = () => {
      calls += 1
      return rect(10, 20)
    }
    act(() => menu.update({ query: '', anchor: measure }))
    await screen.findByTestId('Carol')
    const afterOpen = calls

    // Highlight moves re-render the Root.
    act(() => {
      menu.handleKeyDown(
        new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }),
      )
    })
    act(() => {
      menu.handleKeyDown(
        new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }),
      )
    })

    expect(calls).toBe(afterOpen)
    expect(host).toBeInTheDocument()
  })

  it("doesn't measure on close, when the text may be gone", () => {
    const { menu } = setup()
    let gone = false
    const measure = () => {
      if (gone) throw new RangeError('Position out of range')
      return rect(10, 20)
    }
    act(() => menu.update({ query: '', anchor: measure }))

    gone = true
    expect(() => act(() => menu.close())).not.toThrow()
  })
})

describe('SuggestionMenu placement', () => {
  it('opens below the anchor, aligned to its start', async () => {
    const { menu, side, align } = setup()
    act(() => menu.update({ query: '', anchor: () => rect(10, 20) }))
    await screen.findByTestId('positioner')

    await waitFor(() => expect(side()).toBe('bottom'))
    expect(align()).toBe('start')
  })

  it('flips at open when there is no room below', async () => {
    const { menu, side } = setup()
    act(() => menu.update({ query: '', anchor: () => rect(10, 760) }))
    await screen.findByTestId('positioner')

    await waitFor(() => expect(side()).toBe('top'))
  })

  it('holds the side it opened on once the user types', async () => {
    const { menu, side } = setup()
    act(() => menu.update({ query: '', anchor: () => rect(10, 760) }))
    await screen.findByTestId('positioner')
    await waitFor(() => expect(side()).toBe('top'))

    act(() => menu.update({ query: 'a', anchor: () => rect(10, 760) }))
    // Now there's room below, but the popup stays where it opened.
    act(() => menu.update({ query: 'al', anchor: () => rect(10, 100) }))
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(side()).toBe('top')
  })

  it("doesn't flip the held side when it runs out of room", async () => {
    const { menu, side } = setup()
    act(() => menu.update({ query: '', anchor: () => rect(10, 760) }))
    await screen.findByTestId('positioner')
    await waitFor(() => expect(side()).toBe('top'))
    act(() => menu.update({ query: 'a', anchor: () => rect(10, 760) }))

    // The text scrolled up past the top: only below would fit now.
    act(() => menu.update({ query: 'al', anchor: () => rect(10, -40) }))
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(side()).toBe('top')
  })

  it('chooses again on the next opening when kept mounted', async () => {
    const { menu, side } = setup({}, { keepMounted: true })
    act(() => menu.update({ query: '', anchor: () => rect(10, 760) }))
    await screen.findByTestId('positioner')
    await waitFor(() => expect(side()).toBe('top'))
    act(() => menu.update({ query: 'a', anchor: () => rect(10, 760) }))

    act(() => menu.close())
    await new Promise((resolve) => setTimeout(resolve, 20))
    act(() => menu.update({ query: '', anchor: () => rect(10, 20) }))

    await waitFor(() => expect(side()).toBe('bottom'))
  })

  it('never moves beside the anchor, over the text', async () => {
    const { menu, side } = setup()
    act(() => menu.update({ query: '', anchor: () => rect(10, 300) }))
    const positioner = await screen.findByTestId('positioner')
    // A popup taller than the room above or below, with room beside.
    Object.defineProperty(positioner, 'offsetWidth', { value: 200 })
    Object.defineProperty(positioner, 'offsetHeight', { value: 500 })

    act(() => menu.update({ query: '', anchor: () => rect(12, 300) }))
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(['bottom', 'top']).toContain(side())
  })

  it('flips at open under StrictMode', async () => {
    const { menu, side } = setup({}, { strict: true })
    act(() => menu.update({ query: '', anchor: () => rect(10, 760) }))
    await screen.findByTestId('positioner')

    await waitFor(() => expect(side()).toBe('top'))
  })

  it("doesn't carry a hold from an opening that closed at once", async () => {
    const { menu, side } = setup({}, { keepMounted: true })
    act(() => menu.update({ query: '', anchor: () => rect(10, 20) }))
    act(() => menu.close())
    await new Promise((resolve) => setTimeout(resolve, 50))

    act(() => menu.update({ query: '', anchor: () => rect(10, 760) }))

    await waitFor(() => expect(side()).toBe('top'))
  })

  it('holds the side on the first keystroke when no frame has run', async () => {
    // A background tab runs no animation frames.
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 0)
    const { menu, side } = setup()
    act(() => menu.update({ query: '', anchor: () => rect(10, 760) }))
    await screen.findByTestId('positioner')
    await waitFor(() => expect(side()).toBe('top'))

    act(() => menu.update({ query: 'a', anchor: () => rect(10, 760) }))
    act(() => menu.update({ query: 'al', anchor: () => rect(10, 100) }))
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(side()).toBe('top')
    raf.mockRestore()
  })

  it('waits for an anchor that arrives together with a keystroke', async () => {
    const { menu, side } = setup()
    act(() => menu.update({ query: '', anchor: () => null }))
    await screen.findByTestId('positioner')
    await new Promise((resolve) => setTimeout(resolve, 50))

    act(() => menu.update({ query: 'a', anchor: () => rect(10, 760) }))

    await waitFor(() => expect(side()).toBe('top'))
  })

  it("doesn't count the last opening's anchor as this one's", async () => {
    const { menu, side } = setup({}, { keepMounted: true })
    act(() => menu.update({ query: '', anchor: () => rect(10, 20) }))
    await waitFor(() => expect(side()).toBe('bottom'))
    await new Promise((resolve) => setTimeout(resolve, 50))
    act(() => menu.close())
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Reopened lower down, before the new trigger can be measured.
    act(() => menu.update({ query: '', anchor: () => null }))
    await new Promise((resolve) => setTimeout(resolve, 50))
    act(() => menu.update({ query: '', anchor: () => rect(10, 760) }))

    await waitFor(() => expect(side()).toBe('top'))
  })

  it('waits for an anchor before holding the side', async () => {
    const { menu, side } = setup()
    act(() => menu.update({ query: '', anchor: () => null }))
    await screen.findByTestId('positioner')
    await new Promise((resolve) => setTimeout(resolve, 50))

    act(() => menu.update({ query: '', anchor: () => rect(10, 760) }))

    await waitFor(() => expect(side()).toBe('top'))
  })

  it('holds the side from opening, before the user types', async () => {
    const { menu, side } = setup()
    act(() => menu.update({ query: '', anchor: () => rect(10, 760) }))
    await screen.findByTestId('positioner')
    await waitFor(() => expect(side()).toBe('top'))
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Same query; say remote rows landed and moved things. Room below now.
    act(() => menu.update({ query: '', anchor: () => rect(10, 100) }))
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(side()).toBe('top')
  })

  it('chooses again on the next opening', async () => {
    const { menu, side } = setup()
    act(() => menu.update({ query: '', anchor: () => rect(10, 760) }))
    await screen.findByTestId('positioner')
    await waitFor(() => expect(side()).toBe('top'))
    act(() => menu.update({ query: 'a', anchor: () => rect(10, 760) }))

    act(() => menu.close())
    await waitFor(() =>
      expect(screen.queryByTestId('positioner')).not.toBeInTheDocument(),
    )
    act(() => menu.update({ query: '', anchor: () => rect(10, 20) }))

    await screen.findByTestId('positioner')
    await waitFor(() => expect(side()).toBe('bottom'))
  })
})
