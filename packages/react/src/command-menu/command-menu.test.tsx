import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Kbd } from '../kbd/index.js'
import { CommandMenu } from './index.js'

type CommandMenuRootProps = React.ComponentProps<typeof CommandMenu.Root>

type FixtureSpies = {
  onOpenFile: ReturnType<typeof vi.fn>
  onCopyLink: ReturnType<typeof vi.fn>
  onKeepOpen: ReturnType<typeof vi.fn>
  onCommandPalette: ReturnType<typeof vi.fn>
  onCarrotNote: ReturnType<typeof vi.fn>
  onAccountSettings: ReturnType<typeof vi.fn>
  onBillingSettings: ReturnType<typeof vi.fn>
  onBoldCheckedChange: ReturnType<typeof vi.fn>
  onItalicCheckedChange: ReturnType<typeof vi.fn>
}

function createFixtureSpies(): FixtureSpies {
  return {
    onOpenFile: vi.fn(),
    onCopyLink: vi.fn(),
    onKeepOpen: vi.fn(),
    onCommandPalette: vi.fn(),
    onCarrotNote: vi.fn(),
    onAccountSettings: vi.fn(),
    onBillingSettings: vi.fn(),
    onBoldCheckedChange: vi.fn(),
    onItalicCheckedChange: vi.fn(),
  }
}

function CommandMenuFixture({
  includeInput = true,
  rootProps,
  spies,
}: {
  includeInput?: boolean
  rootProps?: Omit<CommandMenuRootProps, 'children'>
  spies: FixtureSpies
}) {
  return (
    <CommandMenu.Root {...rootProps}>
      <CommandMenu.Trigger data-testid="trigger">
        Open commands
      </CommandMenu.Trigger>
      <CommandMenu.Portal>
        <CommandMenu.Popup data-testid="dialog">
          <CommandMenu.Surface data-testid="surface-root">
            <CommandMenu.Header data-testid="header-root">
              Command palette
            </CommandMenu.Header>
            {includeInput ? (
              <CommandMenu.Input
                aria-label="Search commands"
                data-testid="input-root"
              />
            ) : null}
            <CommandMenu.List data-testid="list-root">
              <CommandMenu.Group data-testid="group-actions">
                <CommandMenu.GroupLabel data-testid="group-label-actions">
                  Actions
                </CommandMenu.GroupLabel>
                <CommandMenu.Item
                  data-testid="item-open-file"
                  onSelect={spies.onOpenFile}
                  value="open-file"
                >
                  Open file
                </CommandMenu.Item>
                <CommandMenu.Item
                  data-testid="item-copy-link"
                  onSelect={spies.onCopyLink}
                  shortcut="c"
                  value="copy-link"
                >
                  Copy link
                  <CommandMenu.Shortcut data-testid="shortcut-copy">
                    C
                  </CommandMenu.Shortcut>
                </CommandMenu.Item>
                <CommandMenu.Item
                  closeOnClick={false}
                  data-testid="item-keep-open"
                  onSelect={spies.onKeepOpen}
                  value="keep-open"
                >
                  Keep open
                </CommandMenu.Item>
                <CommandMenu.Item
                  data-testid="item-command-palette"
                  onSelect={spies.onCommandPalette}
                  value="command-palette"
                >
                  Command palette
                  <CommandMenu.Shortcut data-testid="shortcut-command-palette">
                    <Kbd.Root keys="mod+k" platform="other" />
                  </CommandMenu.Shortcut>
                </CommandMenu.Item>
                <CommandMenu.SubpageTrigger
                  data-testid="item-settings-trigger"
                  targetPageId="settings"
                  value="settings"
                >
                  Settings
                </CommandMenu.SubpageTrigger>
              </CommandMenu.Group>

              <CommandMenu.Group data-testid="group-formatting">
                <CommandMenu.GroupLabel data-testid="group-label-formatting">
                  Formatting
                </CommandMenu.GroupLabel>
                <CommandMenu.CheckboxItem
                  data-testid="item-bold"
                  id="bold"
                  onCheckedChange={spies.onBoldCheckedChange}
                >
                  <CommandMenu.CheckboxItemIndicator data-testid="indicator-bold">
                    Selected
                  </CommandMenu.CheckboxItemIndicator>
                  Bold
                </CommandMenu.CheckboxItem>
                <CommandMenu.CheckboxItem
                  data-testid="item-italic"
                  defaultChecked
                  id="italic"
                  onCheckedChange={spies.onItalicCheckedChange}
                >
                  <CommandMenu.CheckboxItemIndicator data-testid="indicator-italic">
                    Selected
                  </CommandMenu.CheckboxItemIndicator>
                  Italic
                </CommandMenu.CheckboxItem>
                <CommandMenu.Item
                  data-testid="item-carrot-note"
                  onSelect={spies.onCarrotNote}
                  value="carrot-note"
                >
                  Carrot note
                </CommandMenu.Item>
              </CommandMenu.Group>
            </CommandMenu.List>
            <CommandMenu.Empty data-testid="empty-root">
              No commands found
            </CommandMenu.Empty>
          </CommandMenu.Surface>

          <CommandMenu.Subpage pageId="settings">
            <CommandMenu.Surface data-testid="surface-settings">
              <CommandMenu.Header data-testid="header-settings">
                Settings
              </CommandMenu.Header>
              <CommandMenu.Input
                aria-label="Search settings"
                data-testid="input-settings"
              />
              <CommandMenu.List data-testid="list-settings">
                <CommandMenu.SubpageBackItem
                  data-testid="item-settings-back"
                  value="back"
                >
                  Back
                </CommandMenu.SubpageBackItem>
                <CommandMenu.Item
                  data-testid="item-account-settings"
                  onSelect={spies.onAccountSettings}
                  value="account-settings"
                >
                  Account settings
                </CommandMenu.Item>
                <CommandMenu.Item
                  data-testid="item-billing-settings"
                  onSelect={spies.onBillingSettings}
                  value="billing-settings"
                >
                  Billing settings
                </CommandMenu.Item>
              </CommandMenu.List>
              <CommandMenu.Empty data-testid="empty-settings">
                No settings found
              </CommandMenu.Empty>
            </CommandMenu.Surface>
          </CommandMenu.Subpage>
        </CommandMenu.Popup>
      </CommandMenu.Portal>
    </CommandMenu.Root>
  )
}

function renderCommandMenu({
  includeInput,
  rootProps,
}: {
  includeInput?: boolean
  rootProps?: Omit<CommandMenuRootProps, 'children'>
} = {}) {
  const spies = createFixtureSpies()
  const user = userEvent.setup()
  const view = render(
    <CommandMenuFixture
      includeInput={includeInput}
      rootProps={rootProps}
      spies={spies}
    />,
  )

  return { ...view, spies, user }
}

async function waitForRootInputFocus() {
  await waitFor(() => {
    expect(screen.getByTestId('input-root')).toHaveFocus()
  })
}

async function waitForRootListFocus() {
  await waitFor(() => {
    expect(screen.getByTestId('list-root')).toHaveFocus()
  })
}

async function waitForSettingsInputFocus() {
  await waitFor(() => {
    expect(screen.getByTestId('input-settings')).toHaveFocus()
  })
}

describe('CommandMenu', () => {
  describe('Hotkey & open state', () => {
    it('renders defaultOpen with focused input and visible items', async () => {
      renderCommandMenu({ rootProps: { defaultOpen: true } })

      expect(screen.getByTestId('dialog')).toBeInTheDocument()
      expect(screen.getByTestId('item-open-file')).toBeInTheDocument()
      expect(screen.getByTestId('item-copy-link')).toBeInTheDocument()

      await waitForRootInputFocus()
    })

    it('toggles open and closed with the hotkey, including from the focused input', async () => {
      const onOpenChange = vi.fn()
      renderCommandMenu({ rootProps: { hotkey: 'ctrl+k', onOpenChange } })

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()

      fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
      })
      await waitForRootInputFocus()

      fireEvent.keyDown(screen.getByTestId('input-root'), {
        key: 'k',
        ctrlKey: true,
      })

      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
      })
      expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([
        true,
        false,
      ])
    })

    it('respects a controlled open prop and reports requested changes', async () => {
      const onOpenChange = vi.fn()
      const spies = createFixtureSpies()
      const { rerender } = render(
        <CommandMenuFixture
          rootProps={{ hotkey: 'ctrl+k', onOpenChange, open: false }}
          spies={spies}
        />,
      )

      fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

      expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true])
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()

      rerender(
        <CommandMenuFixture
          rootProps={{ hotkey: 'ctrl+k', onOpenChange, open: true }}
          spies={spies}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
      })
      await waitForRootInputFocus()

      fireEvent.keyDown(screen.getByTestId('input-root'), {
        key: 'k',
        ctrlKey: true,
      })

      expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([
        true,
        false,
      ])
      expect(screen.getByTestId('dialog')).toBeInTheDocument()

      rerender(
        <CommandMenuFixture
          rootProps={{ hotkey: 'ctrl+k', onOpenChange, open: false }}
          spies={spies}
        />,
      )

      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
      })
    })

    it('closes with Escape from the root page', async () => {
      const { user } = renderCommandMenu({ rootProps: { defaultOpen: true } })

      await waitForRootInputFocus()

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Filtering', () => {
    it('narrows items, hides empty groups, shows empty state, and restores on clear', async () => {
      const { user } = renderCommandMenu({ rootProps: { defaultOpen: true } })

      await waitForRootInputFocus()

      expect(screen.getByTestId('group-label-actions')).toBeInTheDocument()
      expect(screen.getByTestId('group-label-formatting')).toBeInTheDocument()

      await user.type(screen.getByTestId('input-root'), 'bold')

      await waitFor(() => {
        expect(screen.getByTestId('item-bold')).toBeInTheDocument()
        expect(
          screen.queryByTestId('group-label-actions'),
        ).not.toBeInTheDocument()
      })
      expect(screen.getByTestId('group-label-formatting')).toBeInTheDocument()
      expect(screen.queryByTestId('item-copy-link')).not.toBeInTheDocument()
      expect(screen.queryByTestId('empty-root')).not.toBeInTheDocument()

      await user.clear(screen.getByTestId('input-root'))
      await user.type(screen.getByTestId('input-root'), 'zzzz')

      await waitFor(() => {
        expect(screen.getByTestId('empty-root')).toBeInTheDocument()
      })
      expect(
        screen.queryByTestId('group-label-actions'),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('group-label-formatting'),
      ).not.toBeInTheDocument()

      await user.clear(screen.getByTestId('input-root'))

      await waitFor(() => {
        expect(screen.getByTestId('group-label-actions')).toBeInTheDocument()
        expect(screen.getByTestId('group-label-formatting')).toBeInTheDocument()
        expect(screen.getByTestId('item-open-file')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('empty-root')).not.toBeInTheDocument()
    })
  })

  describe('Keyboard journey', () => {
    it('moves highlight with arrows and Home/End, then Enter selects and closes', async () => {
      const { spies, user } = renderCommandMenu({
        rootProps: { defaultOpen: true },
      })

      await waitForRootInputFocus()
      await waitFor(() => {
        expect(screen.getByTestId('item-open-file')).toHaveAttribute(
          'data-highlighted',
        )
      })

      await user.keyboard('{ArrowDown}')
      await waitFor(() => {
        expect(screen.getByTestId('item-copy-link')).toHaveAttribute(
          'data-highlighted',
        )
      })

      await user.keyboard('{ArrowUp}')
      await waitFor(() => {
        expect(screen.getByTestId('item-open-file')).toHaveAttribute(
          'data-highlighted',
        )
      })

      await user.keyboard('{End}')
      await waitFor(() => {
        expect(screen.getByTestId('item-carrot-note')).toHaveAttribute(
          'data-highlighted',
        )
      })

      await user.keyboard('{Home}{ArrowDown}{Enter}')

      expect(spies.onCopyLink).toHaveBeenCalledTimes(1)
      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
      })
    })

    it('keeps the dialog open when a closeOnClick=false item is selected', async () => {
      const { spies, user } = renderCommandMenu({
        rootProps: { defaultOpen: true },
      })

      await waitForRootInputFocus()

      await user.click(screen.getByTestId('item-keep-open'))

      expect(spies.onKeepOpen).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('dialog')).toBeInTheDocument()
    })
  })

  describe('Checkbox multi-select', () => {
    it('toggles a checkbox item without closing the dialog', async () => {
      const { spies, user } = renderCommandMenu({
        rootProps: { defaultOpen: true },
      })

      await waitForRootInputFocus()

      await user.click(screen.getByTestId('item-bold'))

      expect(spies.onBoldCheckedChange).toHaveBeenCalledWith(
        true,
        expect.anything(),
      )
      expect(screen.getByTestId('item-bold')).toHaveAttribute(
        'aria-checked',
        'true',
      )
      expect(screen.getByTestId('dialog')).toBeInTheDocument()
    })
  })

  describe('Accelerators', () => {
    it('selects an item by shortcut when the list has focus and no input is rendered', async () => {
      const { spies, user } = renderCommandMenu({
        includeInput: false,
        rootProps: { defaultOpen: true },
      })

      await waitForRootListFocus()

      const list = screen.getByTestId('list-root')
      list.focus()
      await user.keyboard('c')

      expect(spies.onCopyLink).toHaveBeenCalledTimes(1)
      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Subpage round-trip', () => {
    it('starts each subpage input with an empty query', async () => {
      const { user } = renderCommandMenu({ rootProps: { defaultOpen: true } })

      await waitForRootInputFocus()

      const rootInput = screen.getByTestId('input-root')

      await user.type(rootInput, 'set')
      expect(rootInput).toHaveValue('set')

      await user.click(screen.getByTestId('item-settings-trigger'))
      await waitForSettingsInputFocus()

      expect(screen.getByTestId('input-settings')).toHaveValue('')
    })

    it('goes to a subpage, returns with empty Backspace and ArrowLeft, and closes from subpage with Escape', async () => {
      const { user } = renderCommandMenu({ rootProps: { defaultOpen: true } })

      await waitForRootInputFocus()

      await user.click(screen.getByTestId('item-settings-trigger'))
      await waitForSettingsInputFocus()
      expect(screen.getByTestId('list-settings')).toBeInTheDocument()
      expect(screen.queryByTestId('list-root')).not.toBeInTheDocument()

      await user.keyboard('{Backspace}')

      await waitFor(() => {
        expect(screen.getByTestId('list-root')).toBeInTheDocument()
        expect(screen.queryByTestId('list-settings')).not.toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-settings-trigger'))
      await waitForSettingsInputFocus()
      await user.keyboard('{ArrowLeft}')

      await waitFor(() => {
        expect(screen.getByTestId('list-root')).toBeInTheDocument()
        expect(screen.queryByTestId('list-settings')).not.toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-settings-trigger'))
      await waitForSettingsInputFocus()
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Structure', () => {
    it('renders Header content before the input', () => {
      renderCommandMenu({ rootProps: { defaultOpen: true } })

      const header = screen.getByTestId('header-root')
      const input = screen.getByTestId('input-root')

      expect(header).toHaveTextContent('Command palette')
      expect(
        header.compareDocumentPosition(input) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    })
  })

  describe('Kbd integration', () => {
    it('renders Ctrl and K keys inside an item shortcut', async () => {
      renderCommandMenu({ rootProps: { defaultOpen: true } })

      await waitForRootInputFocus()

      const shortcut = screen.getByTestId('shortcut-command-palette')
      expect(within(shortcut).getByText('Ctrl')).toBeInTheDocument()
      expect(within(shortcut).getByText('K')).toBeInTheDocument()
    })
  })
})
