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

function CommandMenuWithSubpage() {
  return (
    <CommandMenu.Root defaultOpen>
      <CommandMenu.Trigger data-testid="subpage-trigger-button">
        Open
      </CommandMenu.Trigger>
      <CommandMenu.Portal>
        <CommandMenu.Popup data-testid="subpage-dialog">
          <CommandMenu.Surface data-testid="root-surface">
            <CommandMenu.Header data-testid="header">
              Recent commands
            </CommandMenu.Header>
            <CommandMenu.Input data-testid="root-input" aria-label="Search" />
            <CommandMenu.List data-testid="root-list">
              <CommandMenu.SubpageTrigger
                data-testid="settings-trigger"
                targetPageId="settings"
                value="settings"
              >
                Settings
              </CommandMenu.SubpageTrigger>
              <CommandMenu.Item data-testid="root-item" value="root">
                Root item
              </CommandMenu.Item>
            </CommandMenu.List>
          </CommandMenu.Surface>

          <CommandMenu.Subpage pageId="settings">
            <CommandMenu.Surface data-testid="settings-surface">
              <CommandMenu.Input
                data-testid="settings-input"
                aria-label="Search settings"
              />
              <CommandMenu.List data-testid="settings-list">
                <CommandMenu.Item data-testid="settings-item" value="account">
                  Account settings
                </CommandMenu.Item>
              </CommandMenu.List>
            </CommandMenu.Surface>
          </CommandMenu.Subpage>
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

  it('starts each subpage input with an empty query', async () => {
    const user = userEvent.setup()
    render(<CommandMenuWithSubpage />)

    const rootInput = screen.getByTestId('root-input')
    await waitFor(() => {
      expect(rootInput).toHaveFocus()
    })

    await user.type(rootInput, 'set')
    expect(rootInput).toHaveValue('set')

    await user.click(screen.getByTestId('settings-trigger'))

    const settingsInput = await screen.findByTestId('settings-input')
    expect(settingsInput).toHaveValue('')
  })

  it('goes back from an empty subpage input with Backspace only when empty', async () => {
    const user = userEvent.setup()
    render(<CommandMenuWithSubpage />)

    const rootInput = screen.getByTestId('root-input')
    await waitFor(() => {
      expect(rootInput).toHaveFocus()
    })

    await user.type(rootInput, 'set')
    await user.click(screen.getByTestId('settings-trigger'))

    const emptySettingsInput = await screen.findByTestId('settings-input')
    await waitFor(() => {
      expect(emptySettingsInput).toHaveFocus()
    })

    await user.keyboard('{Backspace}')

    await waitFor(() => {
      expect(screen.getByTestId('root-list')).toBeInTheDocument()
      expect(screen.queryByTestId('settings-list')).not.toBeInTheDocument()
    })

    await user.click(screen.getByTestId('settings-trigger'))

    const filledSettingsInput = await screen.findByTestId('settings-input')
    await waitFor(() => {
      expect(filledSettingsInput).toHaveFocus()
    })

    await user.type(filledSettingsInput, 'abc')
    await user.keyboard('{Backspace}')

    expect(filledSettingsInput).toHaveValue('ab')
    expect(screen.getByTestId('settings-list')).toBeInTheDocument()
    expect(screen.queryByTestId('root-list')).not.toBeInTheDocument()
  })

  it('closes the whole dialog with Escape inside a subpage', async () => {
    const user = userEvent.setup()
    render(<CommandMenuWithSubpage />)

    await waitFor(() => {
      expect(screen.getByTestId('root-input')).toHaveFocus()
    })

    await user.click(screen.getByTestId('settings-trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('settings-input')).toHaveFocus()
    })

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByTestId('subpage-dialog')).not.toBeInTheDocument()
    })
  })

  it('renders Header content before the input', () => {
    render(<CommandMenuWithSubpage />)

    const header = screen.getByTestId('header')
    const input = screen.getByTestId('root-input')

    expect(header).toHaveTextContent('Recent commands')
    expect(header).toHaveAttribute('data-command-menu-header')
    expect(
      header.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})
