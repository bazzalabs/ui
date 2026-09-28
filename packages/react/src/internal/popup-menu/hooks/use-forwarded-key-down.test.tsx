import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../../dropdown-menu/index.js'
import { useFocusOwner } from '../contexts/focus-owner-context.js'
import { usePopupMenuContext } from '../contexts/popup-menu-context.js'
import {
  type ForwardKeyDown,
  toForwardedReactEvent,
  useForwardedKeyDown,
} from './use-forwarded-key-down.js'

function Forwarder(props: { onReady: (forward: ForwardKeyDown) => void }) {
  const { store, closeAll } = usePopupMenuContext()
  const focusOwnerStore = useFocusOwner()
  const forward = useForwardedKeyDown({
    store,
    surfaceId: 'external',
    focusOwnerStore,
    depth: 0,
    submenuContext: null,
    subpageContext: null,
    enabled: true,
    closeAll,
  })
  const { onReady } = props
  React.useEffect(() => {
    onReady(forward)
  }, [onReady, forward])
  return null
}

function Harness(props: {
  onReady: (forward: ForwardKeyDown) => void
  onSelect?: (value: string) => void
  open?: boolean
  values?: string[]
  shortcut?: string
}) {
  const values = props.values ?? ['Apple', 'Banana', 'Cherry']
  return (
    <DropdownMenu.Root defaultOpen open={props.open} modal={false}>
      <Forwarder onReady={props.onReady} />
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                {values.map((value) => (
                  <DropdownMenu.Item
                    key={value}
                    value={value}
                    shortcut={value === 'Banana' ? props.shortcut : undefined}
                    data-testid={value}
                    closeOnClick={false}
                    onSelect={() => props.onSelect?.(value)}
                  >
                    {value}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

const highlighted = () =>
  document.querySelector('[data-highlighted]')?.getAttribute('data-testid')

function key(init: KeyboardEventInit & { key: string }) {
  return new KeyboardEvent('keydown', { bubbles: true, ...init })
}

async function setup(
  onSelect?: (value: string) => void,
  extra: Partial<React.ComponentProps<typeof Harness>> = {},
) {
  let forward!: ForwardKeyDown
  render(
    <Harness onReady={(f) => (forward = f)} onSelect={onSelect} {...extra} />,
  )
  await screen.findByTestId('Cherry')
  await waitFor(() => expect(forward).toBeDefined())
  await waitFor(() => expect(highlighted()).toBe('Apple'))
  return () => forward
}

describe('useForwardedKeyDown', () => {
  it('moves the highlight and reports arrow keys as handled', async () => {
    const forward = await setup()
    const event = key({ key: 'ArrowDown' })

    let handled = false
    act(() => {
      handled = forward()(event)
    })

    expect(handled).toBe(true)
    expect(highlighted()).toBe('Banana')
  })

  it('reports handled even when the event is not cancelable', async () => {
    const forward = await setup()
    const event = key({ key: 'End', cancelable: false })

    let handled = false
    act(() => {
      handled = forward()(event)
    })

    expect(event.defaultPrevented).toBe(false)
    expect(handled).toBe(true)
    expect(highlighted()).toBe('Cherry')
  })

  it('selects the highlighted row on Enter', async () => {
    const selected: string[] = []
    const forward = await setup((value) => selected.push(value))

    let handled = false
    act(() => {
      handled = forward()(key({ key: 'Enter', cancelable: true }))
    })

    expect(handled).toBe(true)
    expect(selected).toEqual(['Apple'])
  })

  it('leaves printable keys and caret keys to the element they were pressed in', async () => {
    const forward = await setup()

    for (const k of ['a', ' ', 'ArrowLeft', 'ArrowRight', 'Backspace']) {
      const event = key({ key: k, cancelable: true })
      let handled = true
      act(() => {
        handled = forward()(event)
      })
      expect(handled).toBe(false)
      expect(event.defaultPrevented).toBe(false)
    }
    expect(highlighted()).toBe('Apple')
  })

  it('ignores keys during IME composition', async () => {
    const forward = await setup()
    const event = key({ key: 'ArrowDown', isComposing: true, cancelable: true })

    let handled = true
    act(() => {
      handled = forward()(event)
    })

    expect(handled).toBe(false)
    expect(highlighted()).toBe('Apple')
  })

  it('ignores events another handler already prevented', async () => {
    const forward = await setup()
    const event = key({ key: 'ArrowDown', cancelable: true })
    event.preventDefault()

    let handled = true
    act(() => {
      handled = forward()(event)
    })

    expect(handled).toBe(false)
    expect(highlighted()).toBe('Apple')
  })

  it('accepts React keyboard events', async () => {
    const forward = await setup()
    const results: boolean[] = []
    function Host() {
      return (
        <input
          data-testid="host"
          onKeyDown={(event) => results.push(forward()(event))}
        />
      )
    }
    render(<Host />)

    fireEvent.keyDown(screen.getByTestId('host'), { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByTestId('host'), { key: 'x' })

    expect(results).toEqual([true, false])
    expect(highlighted()).toBe('Banana')
  })

  it('handles Home and ArrowUp', async () => {
    const forward = await setup()
    act(() => {
      forward()(key({ key: 'End', cancelable: true }))
    })
    expect(highlighted()).toBe('Cherry')

    let handled = false
    act(() => {
      handled = forward()(key({ key: 'ArrowUp', cancelable: true }))
    })
    expect(handled).toBe(true)
    expect(highlighted()).toBe('Banana')

    act(() => {
      handled = forward()(key({ key: 'Home', cancelable: true }))
    })
    expect(handled).toBe(true)
    expect(highlighted()).toBe('Apple')
  })

  it('leaves item shortcuts alone: printable keys belong to the element', async () => {
    const selected: string[] = []
    const forward = await setup((value) => selected.push(value), {
      shortcut: 'b',
    })
    const event = key({ key: 'b', cancelable: true })

    let handled = true
    act(() => {
      handled = forward()(event)
    })

    expect(handled).toBe(false)
    expect(event.defaultPrevented).toBe(false)
    expect(selected).toEqual([])
  })

  it('reads modifier state through the forwarded event', () => {
    const forwarded = toForwardedReactEvent(
      key({ key: 'ArrowDown', shiftKey: true }),
    )
    expect(forwarded.event.getModifierState('Shift')).toBe(true)
  })
})

describe('useForwardedKeyDown when the menu cannot act', () => {
  it('handles nothing while the menu is closed', async () => {
    let forward!: ForwardKeyDown
    render(<Harness open={false} onReady={(f) => (forward = f)} />)
    await waitFor(() => expect(forward).toBeDefined())

    for (const k of ['ArrowDown', 'Enter', 'End']) {
      const event = key({ key: k, cancelable: true })
      let handled = true
      act(() => {
        handled = forward(event)
      })
      expect(handled).toBe(false)
      expect(event.defaultPrevented).toBe(false)
    }
  })

  it('handles neither navigation nor Enter when there are no rows', async () => {
    let forward!: ForwardKeyDown
    render(<Harness values={[]} onReady={(f) => (forward = f)} />)
    await waitFor(() => expect(forward).toBeDefined())

    for (const k of ['ArrowDown', 'Home', 'Enter']) {
      const event = key({ key: k, cancelable: true })
      let handled = true
      act(() => {
        handled = forward(event)
      })
      expect(handled).toBe(false)
      expect(event.defaultPrevented).toBe(false)
    }
  })
})

describe('useForwardedKeyDown inside a Surface', () => {
  it('commits a keyboard span on Enter even when it ends on a non-activatable row', async () => {
    let forward!: ForwardKeyDown
    const changes: string[][] = []
    render(
      <DropdownMenu.Root defaultOpen modal={false}>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <Forwarder onReady={(f) => (forward = f)} />
                <DropdownMenu.List>
                  <DropdownMenu.CheckboxGroup
                    defaultValue={[]}
                    onValueChange={(value) => changes.push(value)}
                  >
                    <DropdownMenu.CheckboxItem value="a" data-testid="a">
                      A
                    </DropdownMenu.CheckboxItem>
                    <DropdownMenu.CheckboxItem value="b" data-testid="b">
                      B
                    </DropdownMenu.CheckboxItem>
                  </DropdownMenu.CheckboxGroup>
                  <DropdownMenu.Item activatable={false} data-testid="note">
                    Note
                  </DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    await screen.findByTestId('note')
    await waitFor(() => expect(forward).toBeDefined())
    await waitFor(() => expect(highlighted()).toBe('a'))

    act(() => {
      forward(key({ key: 'ArrowDown', shiftKey: true, cancelable: true }))
    })
    act(() => {
      forward(key({ key: 'ArrowDown', shiftKey: true, cancelable: true }))
    })
    expect(highlighted()).toBe('note')

    let handled = false
    act(() => {
      handled = forward(key({ key: 'Enter', shiftKey: true, cancelable: true }))
    })

    expect(handled).toBe(true)
    expect(changes.at(-1)).toEqual(['a', 'b'])
  })
})
