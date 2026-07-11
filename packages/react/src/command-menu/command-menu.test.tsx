import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CommandMenu } from './index.js'

function BasicCommandMenu({
  defaultOpen,
  hotkey,
  onSelect,
}: {
  defaultOpen?: boolean
  hotkey?: string
  onSelect?: (value: string) => void
}) {
  return (
    <CommandMenu.Root defaultOpen={defaultOpen} hotkey={hotkey}>
      <CommandMenu.Trigger data-testid="trigger">Open</CommandMenu.Trigger>
      <CommandMenu.Portal>
        <CommandMenu.Popup data-testid="dialog">
          <CommandMenu.Surface data-testid="surface">
            <CommandMenu.Input data-testid="input" aria-label="Search" />
            <CommandMenu.List data-testid="list">
              <CommandMenu.Item
                data-testid="item-apple"
                value="apple"
                onSelect={() => onSelect?.('apple')}
              >
                Apple
              </CommandMenu.Item>
              <CommandMenu.Item
                data-testid="item-banana"
                value="banana"
                onSelect={() => onSelect?.('banana')}
              >
                Banana
              </CommandMenu.Item>
              <CommandMenu.Item
                data-testid="item-carrot"
                value="carrot"
                onSelect={() => onSelect?.('carrot')}
              >
                Carrot
              </CommandMenu.Item>
            </CommandMenu.List>
            <CommandMenu.Empty data-testid="empty">
              No commands
            </CommandMenu.Empty>
          </CommandMenu.Surface>
        </CommandMenu.Popup>
      </CommandMenu.Portal>
    </CommandMenu.Root>
  )
}

describe('CommandMenu', () => {
  it('renders defaultOpen with focused input and visible items', async () => {
    render(<BasicCommandMenu defaultOpen />)

    expect(screen.getByTestId('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('item-apple')).toBeInTheDocument()
    expect(screen.getByTestId('item-banana')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('input')).toHaveFocus()
    })
  })

  it('filters items and selects the highlighted item with Enter', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<BasicCommandMenu defaultOpen onSelect={onSelect} />)

    const input = screen.getByTestId('input')
    await waitFor(() => {
      expect(input).toHaveFocus()
    })

    await user.type(input, 'ban')

    await waitFor(() => {
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByTestId('item-banana')).toHaveAttribute(
        'data-highlighted',
      )
    })

    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith('banana')
    await waitFor(() => {
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
    })
  })

  it('opens with the hotkey prop', async () => {
    render(<BasicCommandMenu hotkey="ctrl+k" />)

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument()
    })
  })

  it('closes with Escape', async () => {
    const user = userEvent.setup()
    render(<BasicCommandMenu defaultOpen />)

    await waitFor(() => {
      expect(screen.getByTestId('input')).toHaveFocus()
    })

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
    })
  })
})
