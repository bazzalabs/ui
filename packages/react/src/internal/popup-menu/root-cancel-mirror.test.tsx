import type { OpenRequestResult } from '@bazza-ui/menu-core'
import { createMenuTreeResolver } from '@bazza-ui/menu-core'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Combobox } from '../../combobox/index.js'
import { CommandMenu } from '../../command-menu/index.js'
import { ContextMenu } from '../../context-menu/index.js'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import { Select } from '../../select/index.js'
import { SuggestionMenu } from '../../suggestion-menu/index.js'
import {
  askFromBaseUI,
  MenuTreeStore,
  mirrorToBaseUI,
} from './store/MenuTreeStore.js'

// A root's consumer that cancels a change Base UI started cancels Base UI's
// details too, so Base UI skips its dismissal's side effects: on Escape, it
// doesn't `preventDefault()` the key.

type Handler = (open: boolean, details: { cancel: () => void }) => void

const cancelCloses = () =>
  vi.fn<Handler>((open, details) => {
    if (!open) details.cancel()
  })

const roots: Array<[string, (onOpenChange: Handler) => React.ReactElement]> = [
  [
    'DropdownMenu.Root',
    (onOpenChange) => (
      <DropdownMenu.Root defaultOpen onOpenChange={onOpenChange}>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup data-testid="popup">
              <DropdownMenu.Surface>
                <DropdownMenu.List data-testid="list">
                  <DropdownMenu.Item value="a">A</DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    ),
  ],
  [
    'ContextMenu.Root',
    (onOpenChange) => (
      <ContextMenu.Root defaultOpen onOpenChange={onOpenChange}>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup data-testid="popup">
              <ContextMenu.Surface>
                <ContextMenu.List data-testid="list">
                  <ContextMenu.Item value="a">A</ContextMenu.Item>
                </ContextMenu.List>
              </ContextMenu.Surface>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    ),
  ],
  [
    'Select.Root',
    (onOpenChange) => (
      <Select.Root defaultOpen onOpenChange={onOpenChange}>
        <Select.Trigger>
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">
              <Select.Surface>
                <Select.List data-testid="list">
                  <Select.Item value="a">A</Select.Item>
                </Select.List>
              </Select.Surface>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    ),
  ],
  [
    'CommandMenu.Root',
    (onOpenChange) => (
      <CommandMenu.Root defaultOpen onOpenChange={onOpenChange}>
        <CommandMenu.Portal>
          <CommandMenu.Popup data-testid="popup">
            <CommandMenu.Surface>
              <CommandMenu.Input aria-label="Search" />
              <CommandMenu.List data-testid="list">
                <CommandMenu.Item value="a">A</CommandMenu.Item>
              </CommandMenu.List>
            </CommandMenu.Surface>
          </CommandMenu.Popup>
        </CommandMenu.Portal>
      </CommandMenu.Root>
    ),
  ],
]

describe("a root's canceled close cancels Base UI's details", () => {
  for (const [name, ui] of roots) {
    it(name, async () => {
      const onOpenChange = cancelCloses()
      render(ui(onOpenChange))
      const popup = await screen.findByTestId('popup')
      await waitFor(() => {
        expect(popup.contains(document.activeElement)).toBe(true)
      })

      const notPrevented = fireEvent.keyDown(document.activeElement ?? popup, {
        key: 'Escape',
      })

      expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
      expect(screen.getByTestId('popup')).toBeInTheDocument()
      // Base UI saw the cancel: it left the key alone
      expect(notPrevented).toBe(true)
    })
  }
})

// Their own keys stay with their input (the host's, the combobox's): an
// Escape outside it reaches only Base UI's dismissal
describe("an input-driven root's canceled close cancels Base UI's details", () => {
  it('SuggestionMenu.Root', async () => {
    const onOpenChange = cancelCloses()
    const menu = SuggestionMenu.createHandle()
    render(
      <>
        <textarea data-testid="host" />
        <SuggestionMenu.Root handle={menu} onOpenChange={onOpenChange}>
          <SuggestionMenu.Portal>
            <SuggestionMenu.Positioner>
              <SuggestionMenu.Popup data-testid="popup">
                <SuggestionMenu.Surface>
                  <SuggestionMenu.List>
                    <SuggestionMenu.Item value="a">A</SuggestionMenu.Item>
                  </SuggestionMenu.List>
                </SuggestionMenu.Surface>
              </SuggestionMenu.Popup>
            </SuggestionMenu.Positioner>
          </SuggestionMenu.Portal>
        </SuggestionMenu.Root>
      </>,
    )
    menu.attach(screen.getByTestId('host'))
    act(() => menu.update({ query: '' }))
    await screen.findByTestId('popup')

    const notPrevented = fireEvent.keyDown(document.body, { key: 'Escape' })

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(notPrevented).toBe(true)
  })

  it('Combobox.Root', async () => {
    const onOpenChange = cancelCloses()
    render(
      <Combobox.Root defaultOpen onOpenChange={onOpenChange}>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup">
              <Combobox.Surface>
                <Combobox.List>
                  <Combobox.Item value="a">A</Combobox.Item>
                </Combobox.List>
              </Combobox.Surface>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    )
    await screen.findByTestId('popup')

    const notPrevented = fireEvent.keyDown(document.body, { key: 'Escape' })

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(notPrevented).toBe(true)
  })
})

// A disabled menu's close policy refuses Base UI's dismissals; Base UI hears
// that too. The Escape goes outside the menu, where only Base UI hears it.
const disabledRoots: Array<[string, () => React.ReactElement]> = [
  [
    'DropdownMenu.Root',
    () => (
      <DropdownMenu.Root defaultOpen disabled>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup data-testid="popup">
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <DropdownMenu.Item value="a">A</DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    ),
  ],
  [
    'ContextMenu.Root',
    () => (
      <ContextMenu.Root defaultOpen disabled>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup data-testid="popup">
              <ContextMenu.Surface>
                <ContextMenu.List>
                  <ContextMenu.Item value="a">A</ContextMenu.Item>
                </ContextMenu.List>
              </ContextMenu.Surface>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    ),
  ],
  [
    'Select.Root',
    () => (
      <Select.Root defaultOpen disabled>
        <Select.Trigger>
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">
              <Select.Surface>
                <Select.List>
                  <Select.Item value="a">A</Select.Item>
                </Select.List>
              </Select.Surface>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    ),
  ],
  [
    'CommandMenu.Root',
    () => (
      <CommandMenu.Root defaultOpen disabled>
        <CommandMenu.Portal>
          <CommandMenu.Popup data-testid="popup">
            <CommandMenu.Surface>
              <CommandMenu.Input aria-label="Search" />
              <CommandMenu.List>
                <CommandMenu.Item value="a">A</CommandMenu.Item>
              </CommandMenu.List>
            </CommandMenu.Surface>
          </CommandMenu.Popup>
        </CommandMenu.Portal>
      </CommandMenu.Root>
    ),
  ],
  [
    'Combobox.Root',
    () => (
      <Combobox.Root defaultOpen disabled>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup">
              <Combobox.Surface>
                <Combobox.List>
                  <Combobox.Item value="a">A</Combobox.Item>
                </Combobox.List>
              </Combobox.Surface>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ),
  ],
]

describe("a disabled root's refused dismissal cancels Base UI's details", () => {
  for (const [name, ui] of disabledRoots) {
    it(name, async () => {
      render(ui())
      await screen.findByTestId('popup')

      const notPrevented = fireEvent.keyDown(document.body, { key: 'Escape' })

      expect(screen.getByTestId('popup')).toBeInTheDocument()
      // Base UI saw the refusal: it left the key alone
      expect(notPrevented).toBe(true)
    })
  }
})

// What every adapter tells Base UI: a change that didn't go through cancels
// its details. A refusal Base UI can't be seen to act on (an outside press
// on an element the menu exempts, which the policy refuses) is told the same.
describe("what Base UI's details hear", () => {
  const details = () => ({
    reason: 'outside-press',
    event: new MouseEvent('pointerdown'),
    cancel: vi.fn(),
  })

  it.each([
    ['canceled', true],
    ['refused', true],
    [null, true],
    ['noop', false],
    ['applied', false],
    ['controlled', false],
  ] as Array<
    [OpenRequestResult | null, boolean]
  >)('%s: canceled %s', (result, canceled) => {
    const d = details()
    mirrorToBaseUI(result, d)
    expect(d.cancel).toHaveBeenCalledTimes(canceled ? 1 : 0)
  })

  it("asks the root's gate, and cancels what it refuses", () => {
    const ask = vi.fn((): OpenRequestResult => 'refused')
    const tree = new MenuTreeStore({ resolver: createMenuTreeResolver(), ask })
    const store = tree.createRootStore()
    const d = details()

    askFromBaseUI(store, false, d)

    expect(ask).toHaveBeenCalledWith(false, 'outside-press', d.event, undefined)
    expect(d.cancel).toHaveBeenCalledTimes(1)
  })
})
