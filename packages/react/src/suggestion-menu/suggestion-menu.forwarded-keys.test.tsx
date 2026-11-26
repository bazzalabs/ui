import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ItemDef } from '../internal/popup-menu/index.js'
import { SuggestionMenu } from './index.js'

// Keys the suggestion keymap passes on to the menu's forwarded-key handling
// (`useForwardedKeyDown`): the host input owns DOM focus and hands each key to
// `handle.handleKeyDown`, which reports whether the menu used it. The keymap's
// own rules (which keys reach the menu at all) are in
// suggestion-menu.keymap.test.tsx.
//
// No public part reaches these guards in `use-forwarded-key-down.ts`:
// - the early return for an event already prevented or a closed menu, and the
//   `isPrintable` return that keeps item shortcuts from firing: the keymap
//   (`root/keymap.ts`) rejects those keys first;
// - the `keyboardSpanActive` Enter bypass: SuggestionMenu mounts the forwarder
//   outside any Surface and drops every Shift key, so no keyboard span exists.

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

function setup(
  options: { values?: string[]; onSelect?: (value: string) => void } = {},
) {
  const menu = SuggestionMenu.createHandle()
  const values = options.values ?? ['Apple', 'Banana', 'Cherry']
  const item = (value: string): ItemDef => ({
    kind: 'item',
    value,
    onSelect: () => options.onSelect?.(value),
    render: ({ props }) => (
      <SuggestionMenu.Item {...props} data-testid={value}>
        {value}
      </SuggestionMenu.Item>
    ),
  })
  const handled: boolean[] = []
  render(
    <>
      <textarea
        data-testid="host"
        ref={(el) => {
          if (el) menu.attach(el)
        }}
        onKeyDown={(event) => handled.push(menu.handleKeyDown(event))}
      />
      <SuggestionMenu.Root handle={menu}>
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup data-testid="popup">
              <SuggestionMenu.Surface content={values.map(item)}>
                <SuggestionMenu.List data-testid="list">
                  <Rows />
                </SuggestionMenu.List>
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    </>,
  )
  /** Passes a DOM keydown to the menu, as non-React editor code does. */
  const forward = (event: KeyboardEvent) => {
    let used = false
    act(() => {
      used = menu.handleKeyDown(event)
    })
    return used
  }
  return { menu, host: screen.getByTestId('host'), handled, forward }
}

async function open(menu: ReturnType<typeof SuggestionMenu.createHandle>) {
  act(() => menu.update({ query: '' }))
  await screen.findByTestId('Cherry')
  await waitFor(() => expect(highlighted()).toBe('Apple'))
}

const highlighted = () =>
  document.querySelector('[data-highlighted]')?.getAttribute('data-testid')

function key(init: KeyboardEventInit & { key: string }) {
  return new KeyboardEvent('keydown', { bubbles: true, ...init })
}

describe('SuggestionMenu forwarded keys', () => {
  it('moves the highlight and reports arrow keys as handled', async () => {
    const { menu, forward } = setup()
    await open(menu)
    const event = key({ key: 'ArrowDown', cancelable: true })

    expect(forward(event)).toBe(true)

    expect(event.defaultPrevented).toBe(true)
    expect(highlighted()).toBe('Banana')
  })

  it('reports handled even when the event is not cancelable', async () => {
    const { menu, forward } = setup()
    await open(menu)
    const event = key({ key: 'End', cancelable: false })

    expect(forward(event)).toBe(true)

    expect(event.defaultPrevented).toBe(false)
    expect(highlighted()).toBe('Cherry')
  })

  it('handles Home and ArrowUp', async () => {
    const { menu, forward } = setup()
    await open(menu)
    forward(key({ key: 'End', cancelable: true }))
    expect(highlighted()).toBe('Cherry')

    expect(forward(key({ key: 'ArrowUp', cancelable: true }))).toBe(true)
    expect(highlighted()).toBe('Banana')

    expect(forward(key({ key: 'Home', cancelable: true }))).toBe(true)
    expect(highlighted()).toBe('Apple')
  })

  it('selects the highlighted row on Enter', async () => {
    const selected: string[] = []
    const { menu, forward } = setup({
      onSelect: (value) => selected.push(value),
    })
    await open(menu)

    expect(forward(key({ key: 'Enter', cancelable: true }))).toBe(true)

    expect(selected).toEqual(['Apple'])
  })

  it('accepts React keyboard events', async () => {
    const { menu, host, handled } = setup()
    await open(menu)

    act(() => {
      fireEvent.keyDown(host, { key: 'ArrowDown' })
    })

    expect(handled).toEqual([true])
    expect(highlighted()).toBe('Banana')
  })

  it('handles neither navigation nor Enter when there are no rows', async () => {
    const { menu, forward } = setup({ values: [] })
    act(() => menu.update({ query: '' }))
    await screen.findByTestId('list')

    for (const k of ['ArrowDown', 'Home', 'Enter']) {
      const event = key({ key: k, cancelable: true })
      expect(forward(event), k).toBe(false)
      expect(event.defaultPrevented, k).toBe(false)
    }
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })
})
