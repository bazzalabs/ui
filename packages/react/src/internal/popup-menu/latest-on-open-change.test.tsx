import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Combobox } from '../../combobox/index.js'
import { CommandMenu } from '../../command-menu/index.js'
import { ContextMenu } from '../../context-menu/index.js'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import { Select } from '../../select/index.js'
import { SuggestionMenu } from '../../suggestion-menu/index.js'

// Each root's tree is made once, on its first render: a re-rendered
// `onOpenChange` must still be the one the menu calls.

type Handler = (open: boolean, details: { reason: string }) => void

/** Renders `ui(first)`, re-renders `ui(second)`, then returns both spies. */
function renderThenSwap(ui: (onOpenChange: Handler) => React.ReactElement) {
  const first = vi.fn<Handler>()
  const second = vi.fn<Handler>()
  const { rerender } = render(ui(first))
  rerender(ui(second))
  return { first, second }
}

describe('a root re-rendered with a new onOpenChange calls the new one', () => {
  it('DropdownMenu.Root', async () => {
    const user = userEvent.setup()
    const { first, second } = renderThenSwap((onOpenChange) => (
      <DropdownMenu.Root onOpenChange={onOpenChange}>
        <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
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
    ))

    await user.click(screen.getByTestId('trigger'))
    await screen.findByTestId('popup')
    expect(second).toHaveBeenCalledWith(true, expect.anything())
    expect(first).not.toHaveBeenCalled()
  })

  it('ContextMenu.Root', async () => {
    const { first, second } = renderThenSwap((onOpenChange) => (
      <ContextMenu.Root onOpenChange={onOpenChange}>
        <ContextMenu.Trigger data-testid="trigger">Area</ContextMenu.Trigger>
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
    ))

    fireEvent.contextMenu(screen.getByTestId('trigger'), {
      clientX: 20,
      clientY: 20,
    })
    await screen.findByTestId('popup')
    expect(second).toHaveBeenCalledWith(true, expect.anything())
    expect(first).not.toHaveBeenCalled()
  })

  it('CommandMenu.Root', async () => {
    const { first, second } = renderThenSwap((onOpenChange) => (
      <CommandMenu.Root hotkey="ctrl+k" onOpenChange={onOpenChange}>
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
    ))

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    await screen.findByTestId('popup')
    expect(second).toHaveBeenCalledWith(true, expect.anything())
    expect(first).not.toHaveBeenCalled()
  })

  it('SuggestionMenu.Root', async () => {
    const menu = SuggestionMenu.createHandle()
    const { first, second } = renderThenSwap((onOpenChange) => (
      <SuggestionMenu.Root handle={menu} onOpenChange={onOpenChange}>
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup data-testid="popup">
              <SuggestionMenu.Surface content={[]}>
                <SuggestionMenu.List />
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    ))

    act(() => menu.update({ query: '' }))
    await screen.findByTestId('popup')
    expect(second).toHaveBeenCalledWith(true, expect.anything())
    expect(first).not.toHaveBeenCalled()
  })

  it('Select.Root', async () => {
    const user = userEvent.setup()
    const { first, second } = renderThenSwap((onOpenChange) => (
      <Select.Root onOpenChange={onOpenChange}>
        <Select.Trigger data-testid="trigger">
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
    ))

    await user.click(screen.getByTestId('trigger'))
    await screen.findByTestId('popup')
    expect(second).toHaveBeenCalledWith(true, expect.anything())
    expect(first).not.toHaveBeenCalled()
  })

  it('Combobox.Root', async () => {
    const { first, second } = renderThenSwap((onOpenChange) => (
      <Combobox.Root defaultOpen onOpenChange={onOpenChange}>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Surface data-testid="surface">
                <Combobox.List>
                  <Combobox.Item value="a">A</Combobox.Item>
                </Combobox.List>
              </Combobox.Surface>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ))
    await screen.findByTestId('surface')

    screen.getByTestId('input').focus()
    fireEvent.keyDown(screen.getByTestId('input'), { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument(),
    )
    expect(second).toHaveBeenCalledWith(false, expect.anything())
    expect(first).not.toHaveBeenCalled()
  })
})
