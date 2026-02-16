import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../index.js'

// ============================================================================
// Test Fixtures
// ============================================================================

function BasicDropdownMenu(props: Partial<DropdownMenu.Root.Props> = {}) {
  return (
    <DropdownMenu.Root {...props}>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="item-1">
                  Item 1
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-2">
                  Item 2
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-3">
                  Item 3
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function DropdownMenuWithAutoHighlight(
  props: { autoHighlightFirst?: boolean | string } = {},
) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              data-testid="surface"
              autoHighlightFirst={props.autoHighlightFirst}
            >
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="item-1" value="first">
                  Item 1
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-2" value="second">
                  Item 2
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-3" value="third">
                  Item 3
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function DropdownMenuWithCheckboxItems({
  checkedState,
  onCheckedChange,
}: {
  checkedState?: Record<string, boolean>
  onCheckedChange?: (id: string, checked: boolean) => void
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List>
                <DropdownMenu.CheckboxItem
                  data-testid="checkbox-1"
                  checked={checkedState?.['checkbox-1']}
                  onCheckedChange={(checked) =>
                    onCheckedChange?.('checkbox-1', checked)
                  }
                >
                  Option 1
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem
                  data-testid="checkbox-2"
                  checked={checkedState?.['checkbox-2']}
                  onCheckedChange={(checked) =>
                    onCheckedChange?.('checkbox-2', checked)
                  }
                >
                  Option 2
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem
                  data-testid="checkbox-3"
                  disabled
                  checked={checkedState?.['checkbox-3']}
                  onCheckedChange={(checked) =>
                    onCheckedChange?.('checkbox-3', checked)
                  }
                >
                  Option 3 (disabled)
                </DropdownMenu.CheckboxItem>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function UncontrolledCheckboxMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List>
                <DropdownMenu.CheckboxItem
                  data-testid="checkbox-1"
                  defaultChecked={false}
                >
                  Option 1
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem
                  data-testid="checkbox-2"
                  defaultChecked={true}
                >
                  Option 2 (default checked)
                </DropdownMenu.CheckboxItem>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function DropdownMenuWithRadioGroup({
  value,
  onValueChange,
}: {
  value?: string
  onValueChange?: (value: string) => void
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List>
                <DropdownMenu.RadioGroup
                  data-testid="radio-group"
                  value={value}
                  onValueChange={onValueChange}
                >
                  <DropdownMenu.RadioItem
                    data-testid="radio-small"
                    value="small"
                  >
                    Small
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem
                    data-testid="radio-medium"
                    value="medium"
                  >
                    Medium
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem
                    data-testid="radio-large"
                    value="large"
                  >
                    Large
                  </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function UncontrolledRadioGroupMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List>
                <DropdownMenu.RadioGroup
                  data-testid="radio-group"
                  defaultValue="medium"
                >
                  <DropdownMenu.RadioItem
                    data-testid="radio-small"
                    value="small"
                  >
                    Small
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem
                    data-testid="radio-medium"
                    value="medium"
                  >
                    Medium
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem
                    data-testid="radio-large"
                    value="large"
                  >
                    Large
                  </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function RadioGroupWithDisabledItem() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List>
                <DropdownMenu.RadioGroup data-testid="radio-group">
                  <DropdownMenu.RadioItem
                    data-testid="radio-small"
                    value="small"
                  >
                    Small
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem
                    data-testid="radio-medium"
                    value="medium"
                    disabled
                  >
                    Medium (disabled)
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem
                    data-testid="radio-large"
                    value="large"
                  >
                    Large
                  </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function DropdownMenuWithSubmenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="item-1">
                  Item 1
                </DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger">
                    More Options
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup>
                        <DropdownMenu.Surface data-testid="submenu-surface">
                          <DropdownMenu.List>
                            <DropdownMenu.Item data-testid="submenu-item-1">
                              Sub Item 1
                            </DropdownMenu.Item>
                            <DropdownMenu.Item data-testid="submenu-item-2">
                              Sub Item 2
                            </DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
                <DropdownMenu.Item data-testid="item-2">
                  Item 2
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

interface SubmenuActionsTestHandle {
  disableSubmenu: () => void
  enableSubmenu: () => void
}

type DropdownMenuWithSubmenuImperativeActionsProps = {}

const DropdownMenuWithSubmenuImperativeActions = React.forwardRef<
  SubmenuActionsTestHandle,
  DropdownMenuWithSubmenuImperativeActionsProps
>(function DropdownMenuWithSubmenuImperativeActions(_, forwardedRef) {
  const submenuActionsRef = React.useRef<DropdownMenu.Submenu.Actions | null>(
    null,
  )

  React.useImperativeHandle(
    forwardedRef,
    () => ({
      disableSubmenu: () => submenuActionsRef.current?.setDisabled(true),
      enableSubmenu: () => submenuActionsRef.current?.setDisabled(false),
    }),
    [],
  )

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="item-1">
                  Item 1
                </DropdownMenu.Item>
                <DropdownMenu.Submenu actionsRef={submenuActionsRef}>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger">
                    More Options
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup>
                        <DropdownMenu.Surface data-testid="submenu-surface">
                          <DropdownMenu.List>
                            <DropdownMenu.Item data-testid="submenu-item-1">
                              Sub Item 1
                            </DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
                <DropdownMenu.Item data-testid="item-2">
                  Item 2
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
})

function DropdownMenuWithNestedSubmenus() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger-1">
                    Level 1
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup>
                        <DropdownMenu.Surface data-testid="submenu-surface-1">
                          <DropdownMenu.List>
                            <DropdownMenu.Item data-testid="submenu-1-item">
                              Level 1 Item
                            </DropdownMenu.Item>
                            <DropdownMenu.Submenu>
                              <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger-2">
                                Level 2
                              </DropdownMenu.SubmenuTrigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Positioner>
                                  <DropdownMenu.Popup>
                                    <DropdownMenu.Surface data-testid="submenu-surface-2">
                                      <DropdownMenu.List>
                                        <DropdownMenu.Item data-testid="submenu-2-item">
                                          Level 2 Item
                                        </DropdownMenu.Item>
                                      </DropdownMenu.List>
                                    </DropdownMenu.Surface>
                                  </DropdownMenu.Popup>
                                </DropdownMenu.Positioner>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Submenu>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function DropdownMenuWithDisabledItems() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="item-1">
                  Item 1
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-2" disabled>
                  Item 2 (disabled)
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-3">
                  Item 3
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function DropdownMenuWithOnSelect() {
  const [selected, setSelected] = React.useState<string | null>(null)

  return (
    <div>
      <div data-testid="selected">{selected ?? 'none'}</div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger data-testid="trigger">
          Open Menu
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface data-testid="surface">
                <DropdownMenu.List>
                  <DropdownMenu.Item
                    data-testid="item-1"
                    onSelect={() => setSelected('item-1')}
                  >
                    Item 1
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    data-testid="item-2"
                    onSelect={() => setSelected('item-2')}
                  >
                    Item 2
                  </DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

function ControlledDropdownMenu({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (
    open: boolean,
    details: DropdownMenu.Root.OpenChangeEventDetails,
  ) => void
}) {
  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="item-1">
                  Item 1
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function DropdownMenuWithImperativeActions() {
  const actionsRef = React.useRef<DropdownMenu.Root.Actions | null>(null)

  return (
    <div>
      <button
        type="button"
        data-testid="disable-menu"
        onClick={() => actionsRef.current?.setDisabled(true)}
      >
        Disable Menu
      </button>
      <button
        type="button"
        data-testid="enable-menu"
        onClick={() => actionsRef.current?.setDisabled(false)}
      >
        Enable Menu
      </button>
      <button
        type="button"
        data-testid="close-menu"
        onClick={() => actionsRef.current?.close()}
      >
        Close Menu
      </button>

      <DropdownMenu.Root actionsRef={actionsRef}>
        <DropdownMenu.Trigger data-testid="trigger">
          Open Menu
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface data-testid="surface">
                <DropdownMenu.List>
                  <DropdownMenu.Item data-testid="item-1">
                    Item 1
                  </DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

function DropdownMenuWithNestedSubpages() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="root-surface">
              <DropdownMenu.List data-testid="root-list">
                <DropdownMenu.SubpageTrigger
                  data-testid="subpage-trigger-1"
                  targetPageId="page-1"
                >
                  Page 1
                </DropdownMenu.SubpageTrigger>
              </DropdownMenu.List>
            </DropdownMenu.Surface>

            <DropdownMenu.Subpage pageId="page-1">
              <DropdownMenu.Surface data-testid="subpage-surface-1">
                <DropdownMenu.SubpageBack data-testid="subpage-back-button">
                  Back
                </DropdownMenu.SubpageBack>
                <DropdownMenu.List data-testid="subpage-list-1">
                  <DropdownMenu.SubpageTrigger
                    data-testid="subpage-trigger-2"
                    targetPageId="page-2"
                  >
                    Page 2
                  </DropdownMenu.SubpageTrigger>
                  <DropdownMenu.SubpageBackItem data-testid="subpage-back-item-1">
                    Back to root
                  </DropdownMenu.SubpageBackItem>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Subpage>

            <DropdownMenu.Subpage pageId="page-2">
              <DropdownMenu.Surface data-testid="subpage-surface-2">
                <DropdownMenu.List data-testid="subpage-list-2">
                  <DropdownMenu.SubpageBackItem data-testid="subpage-back-item-2">
                    Back to page 1
                  </DropdownMenu.SubpageBackItem>
                  <DropdownMenu.Item data-testid="subpage-item-2">
                    Page 2 Item
                  </DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Subpage>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function DropdownMenuWithSubpageRenderSpy({
  onSubpageRender,
}: {
  onSubpageRender: () => void
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="root-surface">
              <DropdownMenu.List>
                <DropdownMenu.SubpageTrigger
                  data-testid="subpage-trigger-1"
                  targetPageId="page-1"
                >
                  Page 1
                </DropdownMenu.SubpageTrigger>
              </DropdownMenu.List>
            </DropdownMenu.Surface>

            <DropdownMenu.Subpage pageId="page-1">
              <SubpageRenderSpy onRender={onSubpageRender} />
            </DropdownMenu.Subpage>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function SubpageRenderSpy({ onRender }: { onRender: () => void }) {
  onRender()
  return <div data-testid="subpage-content">Subpage content</div>
}

// ============================================================================
// Tests
// ============================================================================

describe('<DropdownMenu.Root />', () => {
  describe('open/close behavior', () => {
    it('opens when trigger is clicked', async () => {
      const user = userEvent.setup()
      render(<BasicDropdownMenu />)

      const trigger = screen.getByTestId('trigger')
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()

      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })

    it('closes when clicking trigger again (toggle)', async () => {
      const user = userEvent.setup()
      render(<BasicDropdownMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })

    it('closes when Escape is pressed', async () => {
      const user = userEvent.setup()
      render(<BasicDropdownMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })

    it('closes when clicking outside', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <button type="button" data-testid="outside">
            Outside
          </button>
          <BasicDropdownMenu defaultOpen />
        </div>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('outside'))

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })

    it('opens with Enter key on trigger', async () => {
      const user = userEvent.setup()
      render(<BasicDropdownMenu />)

      const trigger = screen.getByTestId('trigger')
      trigger.focus()

      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })

    it('opens with Space key on trigger', async () => {
      const user = userEvent.setup()
      render(<BasicDropdownMenu />)

      const trigger = screen.getByTestId('trigger')
      trigger.focus()

      await user.keyboard(' ')

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })
  })

  describe('controlled mode', () => {
    it('respects controlled open prop', async () => {
      const onOpenChange = vi.fn()

      const { rerender } = render(
        <ControlledDropdownMenu open={false} onOpenChange={onOpenChange} />,
      )

      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()

      rerender(
        <ControlledDropdownMenu open={true} onOpenChange={onOpenChange} />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })

    it('calls onOpenChange with event details when opening', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      render(
        <ControlledDropdownMenu open={false} onOpenChange={onOpenChange} />,
      )

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      expect(onOpenChange).toHaveBeenCalledWith(
        true,
        expect.objectContaining({
          reason: expect.any(String),
        }),
      )
    })

    it('calls onOpenChange with event details when closing via Escape', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      render(<ControlledDropdownMenu open={true} onOpenChange={onOpenChange} />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      expect(onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({
          reason: 'escape-key',
        }),
      )
    })
  })

  describe('uncontrolled mode', () => {
    it('respects defaultOpen prop', async () => {
      render(<BasicDropdownMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })

    it('starts closed by default', () => {
      render(<BasicDropdownMenu />)
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
    })
  })

  describe('imperative actions', () => {
    it('blocks opening when disabled imperatively and reopens when re-enabled', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithImperativeActions />)

      await user.click(screen.getByTestId('disable-menu'))
      await user.click(screen.getByTestId('trigger'))

      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()

      await user.click(screen.getByTestId('enable-menu'))
      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })

    it('can close imperatively even while disabled', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithImperativeActions />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('disable-menu'))
      await user.click(screen.getByTestId('close-menu'))

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })
  })

  describe('item selection', () => {
    it('closes menu when item is clicked (closeOnClick=true by default)', async () => {
      const user = userEvent.setup()
      render(<BasicDropdownMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-1'))

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })

    it('calls onSelect when item is clicked', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithOnSelect />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-1'))

      expect(screen.getByTestId('selected')).toHaveTextContent('item-1')
    })

    it('does not select disabled items', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithDisabledItems />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const disabledItem = screen.getByTestId('item-2')
      await user.click(disabledItem)

      // Menu should still be open since disabled items don't close
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })
  })

  describe('keyboard navigation', () => {
    it('navigates with ArrowDown', async () => {
      const user = userEvent.setup()
      render(<BasicDropdownMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // When menu opens, first item is already highlighted
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-highlighted')

      // Focus the list to enable keyboard navigation
      const list = screen.getByRole('listbox')
      list.focus()

      // ArrowDown moves to next item
      await user.keyboard('{ArrowDown}')

      const item2 = screen.getByTestId('item-2')
      expect(item2).toHaveAttribute('data-highlighted')
    })

    it('navigates with ArrowUp', async () => {
      const user = userEvent.setup()
      render(<BasicDropdownMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // First item is highlighted on open
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-highlighted')

      const list = screen.getByRole('listbox')
      list.focus()

      // Go down to item-2, then down to item-3, then up to item-2
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      expect(screen.getByTestId('item-3')).toHaveAttribute('data-highlighted')

      await user.keyboard('{ArrowUp}')
      expect(screen.getByTestId('item-2')).toHaveAttribute('data-highlighted')
    })

    it('skips disabled items during navigation', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithDisabledItems />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // First item is already highlighted when menu opens
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-highlighted')

      const list = screen.getByRole('listbox')
      list.focus()

      // Navigate down - should skip item-2 (disabled) and go to item-3
      await user.keyboard('{ArrowDown}')
      expect(screen.getByTestId('item-3')).toHaveAttribute('data-highlighted')
    })

    it('navigates to first item with Home key', async () => {
      const user = userEvent.setup()
      render(<BasicDropdownMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const surface = screen.getByTestId('surface')
      surface.focus()

      // Navigate to last item first
      await user.keyboard('{End}')
      expect(screen.getByTestId('item-3')).toHaveAttribute('data-highlighted')

      // Then Home should go back to first
      await user.keyboard('{Home}')
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-highlighted')
    })

    it('navigates to last item with End key', async () => {
      const user = userEvent.setup()
      render(<BasicDropdownMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const surface = screen.getByTestId('surface')
      surface.focus()

      await user.keyboard('{End}')
      expect(screen.getByTestId('item-3')).toHaveAttribute('data-highlighted')
    })

    it('selects item with Enter key', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithOnSelect />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // First item is already highlighted when menu opens
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-highlighted')

      const list = screen.getByRole('listbox')
      list.focus()

      // Press Enter to select the highlighted item (item-1)
      await user.keyboard('{Enter}')

      expect(screen.getByTestId('selected')).toHaveTextContent('item-1')
    })
  })

  describe('modal behavior', () => {
    it('defaults to modal=true', async () => {
      const user = userEvent.setup()
      render(<BasicDropdownMenu />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // In modal mode, the menu should trap focus
      // This is handled by Base UI's Popover
    })
  })

  describe('ARIA attributes', () => {
    it('trigger has correct ARIA attributes when closed', () => {
      render(<BasicDropdownMenu />)

      const trigger = screen.getByTestId('trigger')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('trigger has correct ARIA attributes when open', async () => {
      render(<BasicDropdownMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const trigger = screen.getByTestId('trigger')
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    it('items have correct role', async () => {
      render(<BasicDropdownMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const item = screen.getByTestId('item-1')
      expect(item).toHaveAttribute('role', 'option')
    })

    it('disabled items have aria-disabled', async () => {
      render(<DropdownMenuWithDisabledItems />)

      const trigger = screen.getByTestId('trigger')
      const user = userEvent.setup()
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const disabledItem = screen.getByTestId('item-2')
      expect(disabledItem).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('autoHighlightFirst', () => {
    it('highlights first item when autoHighlightFirst=true (default)', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithAutoHighlight autoHighlightFirst={true} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // First item should be auto-highlighted
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-highlighted')
      expect(screen.getByTestId('item-2')).not.toHaveAttribute(
        'data-highlighted',
      )
    })

    it('highlights specific item when autoHighlightFirst is a string value', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithAutoHighlight autoHighlightFirst="second" />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Wait for Surface's useEffect to call applyAutoHighlight()
      // The open observer initially highlights first item, then Surface's effect
      // applies the string value highlight
      await waitFor(() => {
        expect(screen.getByTestId('item-2')).toHaveAttribute('data-highlighted')
      })

      // Verify other items are not highlighted
      expect(screen.getByTestId('item-1')).not.toHaveAttribute(
        'data-highlighted',
      )
      expect(screen.getByTestId('item-3')).not.toHaveAttribute(
        'data-highlighted',
      )
    })

    it('falls back to first item when string value does not match any item', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithAutoHighlight autoHighlightFirst="nonexistent" />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // When no matching item, falls back to first item (default behavior)
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-highlighted')
      expect(screen.getByTestId('item-2')).not.toHaveAttribute(
        'data-highlighted',
      )
      expect(screen.getByTestId('item-3')).not.toHaveAttribute(
        'data-highlighted',
      )
    })

    it('allows keyboard navigation from highlighted item', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithAutoHighlight autoHighlightFirst={true} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // First item highlighted on open
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-highlighted')

      // Focus the list and press ArrowDown
      const list = screen.getByRole('listbox')
      list.focus()
      await user.keyboard('{ArrowDown}')

      // Second item should now be highlighted
      expect(screen.getByTestId('item-2')).toHaveAttribute('data-highlighted')
    })
  })

  describe('CheckboxItem', () => {
    describe('controlled mode', () => {
      it('displays checked state from controlled prop', async () => {
        const user = userEvent.setup()
        render(
          <DropdownMenuWithCheckboxItems
            checkedState={{ 'checkbox-1': true, 'checkbox-2': false }}
            onCheckedChange={() => {}}
          />,
        )

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // checkbox-1 should be checked
        expect(screen.getByTestId('checkbox-1')).toHaveAttribute(
          'aria-checked',
          'true',
        )
        expect(screen.getByTestId('checkbox-1')).toHaveAttribute('data-checked')

        // checkbox-2 should be unchecked
        expect(screen.getByTestId('checkbox-2')).toHaveAttribute(
          'aria-checked',
          'false',
        )
        expect(screen.getByTestId('checkbox-2')).toHaveAttribute(
          'data-unchecked',
        )
      })

      it('calls onCheckedChange when checkbox is clicked', async () => {
        const user = userEvent.setup()
        const onCheckedChange = vi.fn()

        render(
          <DropdownMenuWithCheckboxItems
            checkedState={{ 'checkbox-1': false }}
            onCheckedChange={onCheckedChange}
          />,
        )

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        await user.click(screen.getByTestId('checkbox-1'))

        expect(onCheckedChange).toHaveBeenCalledWith('checkbox-1', true)
      })

      it('calls onCheckedChange with false when unchecking', async () => {
        const user = userEvent.setup()
        const onCheckedChange = vi.fn()

        render(
          <DropdownMenuWithCheckboxItems
            checkedState={{ 'checkbox-1': true }}
            onCheckedChange={onCheckedChange}
          />,
        )

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        await user.click(screen.getByTestId('checkbox-1'))

        expect(onCheckedChange).toHaveBeenCalledWith('checkbox-1', false)
      })
    })

    describe('uncontrolled mode', () => {
      it('respects defaultChecked prop', async () => {
        const user = userEvent.setup()
        render(<UncontrolledCheckboxMenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // checkbox-1 has defaultChecked=false
        expect(screen.getByTestId('checkbox-1')).toHaveAttribute(
          'aria-checked',
          'false',
        )

        // checkbox-2 has defaultChecked=true
        expect(screen.getByTestId('checkbox-2')).toHaveAttribute(
          'aria-checked',
          'true',
        )
      })

      it('toggles checked state on click in uncontrolled mode', async () => {
        const user = userEvent.setup()
        render(<UncontrolledCheckboxMenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        const checkbox1 = screen.getByTestId('checkbox-1')
        expect(checkbox1).toHaveAttribute('aria-checked', 'false')

        // Click to check
        await user.click(checkbox1)
        expect(checkbox1).toHaveAttribute('aria-checked', 'true')

        // Click again to uncheck
        await user.click(checkbox1)
        expect(checkbox1).toHaveAttribute('aria-checked', 'false')
      })
    })

    describe('disabled state', () => {
      it('renders disabled checkbox with aria-disabled', async () => {
        const user = userEvent.setup()
        render(<DropdownMenuWithCheckboxItems />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        const disabledCheckbox = screen.getByTestId('checkbox-3')
        expect(disabledCheckbox).toHaveAttribute('aria-disabled', 'true')
      })

      it('does not call onCheckedChange for disabled checkbox', async () => {
        const user = userEvent.setup()
        const onCheckedChange = vi.fn()

        render(
          <DropdownMenuWithCheckboxItems onCheckedChange={onCheckedChange} />,
        )

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        await user.click(screen.getByTestId('checkbox-3'))

        expect(onCheckedChange).not.toHaveBeenCalled()
      })
    })

    describe('keyboard interaction', () => {
      it('toggles checkbox with Enter key', async () => {
        const user = userEvent.setup()
        render(<UncontrolledCheckboxMenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        const checkbox1 = screen.getByTestId('checkbox-1')
        expect(checkbox1).toHaveAttribute('aria-checked', 'false')

        // First item is already highlighted, press Enter
        const list = screen.getByRole('listbox')
        list.focus()
        await user.keyboard('{Enter}')

        expect(checkbox1).toHaveAttribute('aria-checked', 'true')
      })
    })

    describe('ARIA attributes', () => {
      it('has role="menuitemcheckbox"', async () => {
        const user = userEvent.setup()
        render(<UncontrolledCheckboxMenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        expect(screen.getByTestId('checkbox-1')).toHaveAttribute(
          'role',
          'menuitemcheckbox',
        )
      })
    })

    describe('closeOnClick behavior', () => {
      it('keeps menu open by default (closeOnClick=false)', async () => {
        const user = userEvent.setup()
        render(<UncontrolledCheckboxMenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        await user.click(screen.getByTestId('checkbox-1'))

        // Menu should still be open
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })
  })

  describe('RadioGroup and RadioItem', () => {
    describe('controlled mode', () => {
      it('displays selected state from controlled value prop', async () => {
        const user = userEvent.setup()
        render(
          <DropdownMenuWithRadioGroup
            value="medium"
            onValueChange={() => {}}
          />,
        )

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // medium should be checked
        expect(screen.getByTestId('radio-medium')).toHaveAttribute(
          'aria-checked',
          'true',
        )
        expect(screen.getByTestId('radio-medium')).toHaveAttribute(
          'data-checked',
        )

        // others should be unchecked
        expect(screen.getByTestId('radio-small')).toHaveAttribute(
          'aria-checked',
          'false',
        )
        expect(screen.getByTestId('radio-large')).toHaveAttribute(
          'aria-checked',
          'false',
        )
      })

      it('calls onValueChange when radio item is clicked', async () => {
        const user = userEvent.setup()
        const onValueChange = vi.fn()

        render(
          <DropdownMenuWithRadioGroup
            value="small"
            onValueChange={onValueChange}
          />,
        )

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        await user.click(screen.getByTestId('radio-large'))

        expect(onValueChange).toHaveBeenCalledWith(
          'large',
          expect.objectContaining({
            reason: expect.any(String),
          }),
        )
      })
    })

    describe('uncontrolled mode', () => {
      it('respects defaultValue prop', async () => {
        const user = userEvent.setup()
        render(<UncontrolledRadioGroupMenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // defaultValue="medium"
        expect(screen.getByTestId('radio-medium')).toHaveAttribute(
          'aria-checked',
          'true',
        )
        expect(screen.getByTestId('radio-small')).toHaveAttribute(
          'aria-checked',
          'false',
        )
        expect(screen.getByTestId('radio-large')).toHaveAttribute(
          'aria-checked',
          'false',
        )
      })

      it('changes selection on click in uncontrolled mode', async () => {
        const user = userEvent.setup()
        render(<UncontrolledRadioGroupMenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // Initially medium is selected (defaultValue)
        expect(screen.getByTestId('radio-medium')).toHaveAttribute(
          'aria-checked',
          'true',
        )

        // Click small
        await user.click(screen.getByTestId('radio-small'))

        // Now small should be selected
        expect(screen.getByTestId('radio-small')).toHaveAttribute(
          'aria-checked',
          'true',
        )
        expect(screen.getByTestId('radio-medium')).toHaveAttribute(
          'aria-checked',
          'false',
        )
      })

      it('only allows one item to be selected at a time', async () => {
        const user = userEvent.setup()
        render(<UncontrolledRadioGroupMenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // Click small
        await user.click(screen.getByTestId('radio-small'))
        expect(screen.getByTestId('radio-small')).toHaveAttribute(
          'aria-checked',
          'true',
        )

        // Click large
        await user.click(screen.getByTestId('radio-large'))

        // Only large should be checked
        expect(screen.getByTestId('radio-large')).toHaveAttribute(
          'aria-checked',
          'true',
        )
        expect(screen.getByTestId('radio-small')).toHaveAttribute(
          'aria-checked',
          'false',
        )
        expect(screen.getByTestId('radio-medium')).toHaveAttribute(
          'aria-checked',
          'false',
        )
      })
    })

    describe('disabled state', () => {
      it('renders disabled radio item with aria-disabled', async () => {
        const user = userEvent.setup()
        render(<RadioGroupWithDisabledItem />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        expect(screen.getByTestId('radio-medium')).toHaveAttribute(
          'aria-disabled',
          'true',
        )
      })

      it('does not select disabled radio item on click', async () => {
        const user = userEvent.setup()
        render(<RadioGroupWithDisabledItem />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // Click on disabled item
        await user.click(screen.getByTestId('radio-medium'))

        // Should not be selected
        expect(screen.getByTestId('radio-medium')).toHaveAttribute(
          'aria-checked',
          'false',
        )
      })
    })

    describe('keyboard interaction', () => {
      it('selects radio item with Enter key', async () => {
        const user = userEvent.setup()
        render(<UncontrolledRadioGroupMenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // Navigate to small (first item is highlighted)
        const list = screen.getByRole('listbox')
        list.focus()

        // Press Enter on the first highlighted item (small)
        await user.keyboard('{Enter}')

        expect(screen.getByTestId('radio-small')).toHaveAttribute(
          'aria-checked',
          'true',
        )
      })
    })

    describe('ARIA attributes', () => {
      it('radio group has role="group"', async () => {
        const user = userEvent.setup()
        render(<UncontrolledRadioGroupMenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        expect(screen.getByTestId('radio-group')).toHaveAttribute(
          'role',
          'group',
        )
      })

      it('radio items have role="menuitemradio"', async () => {
        const user = userEvent.setup()
        render(<UncontrolledRadioGroupMenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        expect(screen.getByTestId('radio-small')).toHaveAttribute(
          'role',
          'menuitemradio',
        )
      })
    })

    describe('closeOnClick behavior', () => {
      it('keeps menu open by default (closeOnClick=false)', async () => {
        const user = userEvent.setup()
        render(<UncontrolledRadioGroupMenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        await user.click(screen.getByTestId('radio-small'))

        // Menu should still be open
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })
  })

  describe('Submenu', () => {
    describe('ARIA attributes', () => {
      it('submenu trigger has aria-haspopup="menu"', async () => {
        const user = userEvent.setup()
        render(<DropdownMenuWithSubmenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        expect(screen.getByTestId('submenu-trigger')).toHaveAttribute(
          'aria-haspopup',
          'menu',
        )
      })

      it('submenu trigger has aria-expanded=false when closed', async () => {
        const user = userEvent.setup()
        render(<DropdownMenuWithSubmenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        expect(screen.getByTestId('submenu-trigger')).toHaveAttribute(
          'aria-expanded',
          'false',
        )
      })

      it('submenu trigger has role="menuitem"', async () => {
        const user = userEvent.setup()
        render(<DropdownMenuWithSubmenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        expect(screen.getByTestId('submenu-trigger')).toHaveAttribute(
          'role',
          'menuitem',
        )
      })
    })

    describe('keyboard navigation', () => {
      it('opens submenu with ArrowRight when trigger is highlighted', async () => {
        const user = userEvent.setup()
        render(<DropdownMenuWithSubmenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // Navigate to submenu trigger (it's the second item)
        const list = screen.getByRole('listbox')
        list.focus()
        await user.keyboard('{ArrowDown}')

        // Verify submenu trigger is highlighted
        expect(screen.getByTestId('submenu-trigger')).toHaveAttribute(
          'data-highlighted',
        )

        // Press ArrowRight to open submenu
        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-surface')).toBeInTheDocument()
        })
      })

      it('closes submenu with ArrowLeft and returns focus to parent', async () => {
        const user = userEvent.setup()
        render(<DropdownMenuWithSubmenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // Navigate to and open submenu
        const list = screen.getByRole('listbox')
        list.focus()
        await user.keyboard('{ArrowDown}')
        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-surface')).toBeInTheDocument()
        })

        // Press ArrowLeft to close submenu
        await user.keyboard('{ArrowLeft}')

        await waitFor(() => {
          expect(
            screen.queryByTestId('submenu-surface'),
          ).not.toBeInTheDocument()
        })

        // Parent menu should still be open
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      it('closes submenu with Escape', async () => {
        const user = userEvent.setup()
        render(<DropdownMenuWithSubmenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // Navigate to and open submenu
        const list = screen.getByRole('listbox')
        list.focus()
        await user.keyboard('{ArrowDown}')
        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-surface')).toBeInTheDocument()
        })

        // Press Escape to close
        await user.keyboard('{Escape}')

        // By default closeRootOnEsc=true, so entire menu should close
        await waitFor(() => {
          expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
        })
      })
    })

    describe('nested submenus', () => {
      it('supports multiple levels of nesting', async () => {
        const user = userEvent.setup()
        render(<DropdownMenuWithNestedSubmenus />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // Open first level submenu
        const list = screen.getByRole('listbox')
        list.focus()
        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-surface-1')).toBeInTheDocument()
        })

        // Navigate to second level submenu trigger
        await user.keyboard('{ArrowDown}')
        expect(screen.getByTestId('submenu-trigger-2')).toHaveAttribute(
          'data-highlighted',
        )

        // Open second level submenu
        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-surface-2')).toBeInTheDocument()
        })
      })

      it('closes entire menu tree when clicking an item in nested submenu', async () => {
        const user = userEvent.setup()
        render(<DropdownMenuWithNestedSubmenus />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // Open first level submenu
        const list = screen.getByRole('listbox')
        list.focus()
        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-surface-1')).toBeInTheDocument()
        })

        // Navigate to and open second level submenu
        await user.keyboard('{ArrowDown}')
        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-surface-2')).toBeInTheDocument()
        })

        // Click item in second level submenu
        await user.click(screen.getByTestId('submenu-2-item'))

        // Entire menu tree should close
        await waitFor(() => {
          expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
          expect(
            screen.queryByTestId('submenu-surface-1'),
          ).not.toBeInTheDocument()
          expect(
            screen.queryByTestId('submenu-surface-2'),
          ).not.toBeInTheDocument()
        })
      })

      it('closes all submenus when parent closes', async () => {
        const user = userEvent.setup()
        render(<DropdownMenuWithNestedSubmenus />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // Open both levels of submenus
        const list = screen.getByRole('listbox')
        list.focus()
        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-surface-1')).toBeInTheDocument()
        })

        await user.keyboard('{ArrowDown}')
        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-surface-2')).toBeInTheDocument()
        })

        // Press Escape to close everything
        await user.keyboard('{Escape}')

        await waitFor(() => {
          expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
          expect(
            screen.queryByTestId('submenu-surface-1'),
          ).not.toBeInTheDocument()
          expect(
            screen.queryByTestId('submenu-surface-2'),
          ).not.toBeInTheDocument()
        })
      })
    })

    describe('imperative actions', () => {
      it('setDisabled only affects submenu and not root menu interactions', async () => {
        const user = userEvent.setup()
        const actions = React.createRef<SubmenuActionsTestHandle>()
        render(<DropdownMenuWithSubmenuImperativeActions ref={actions} />)

        await user.click(screen.getByTestId('trigger'))

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        act(() => {
          actions.current?.disableSubmenu()
        })

        expect(screen.getByTestId('trigger')).not.toHaveAttribute(
          'data-disabled',
        )

        expect(screen.getByTestId('submenu-trigger')).toHaveAttribute(
          'aria-disabled',
          'true',
        )

        await user.click(screen.getByTestId('submenu-trigger'))
        expect(screen.queryByTestId('submenu-surface')).not.toBeInTheDocument()

        await user.click(screen.getByTestId('item-1'))
        await waitFor(() => {
          expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
        })

        await user.click(screen.getByTestId('trigger'))

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        act(() => {
          actions.current?.enableSubmenu()
        })

        expect(screen.getByTestId('submenu-trigger')).not.toHaveAttribute(
          'aria-disabled',
        )

        const reopenedList = screen.getByRole('listbox')
        reopenedList.focus()
        await user.keyboard('{ArrowDown}')

        expect(screen.getByTestId('submenu-trigger')).toHaveAttribute(
          'data-highlighted',
        )

        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-surface')).toBeInTheDocument()
        })
      })
    })

    describe('data attributes', () => {
      it('submenu trigger has data-submenu-trigger', async () => {
        const user = userEvent.setup()
        render(<DropdownMenuWithSubmenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        expect(screen.getByTestId('submenu-trigger')).toHaveAttribute(
          'data-submenu-trigger',
        )
      })

      it('submenu trigger has data-popup-open when submenu is open', async () => {
        const user = userEvent.setup()
        render(<DropdownMenuWithSubmenu />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // Open submenu
        const list = screen.getByRole('listbox')
        list.focus()
        await user.keyboard('{ArrowDown}')
        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-surface')).toBeInTheDocument()
        })

        expect(screen.getByTestId('submenu-trigger')).toHaveAttribute(
          'data-popup-open',
        )
      })
    })
  })

  describe('Subpage', () => {
    it('does not render inactive subpage children before navigation', async () => {
      const user = userEvent.setup()
      const onSubpageRender = vi.fn()

      render(
        <DropdownMenuWithSubpageRenderSpy onSubpageRender={onSubpageRender} />,
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('root-surface')).toBeInTheDocument()
      })

      expect(onSubpageRender).not.toHaveBeenCalled()
      expect(screen.queryByTestId('subpage-content')).not.toBeInTheDocument()

      await user.click(screen.getByTestId('subpage-trigger-1'))

      await waitFor(() => {
        expect(screen.getByTestId('subpage-content')).toBeInTheDocument()
      })

      expect(onSubpageRender).toHaveBeenCalled()
    })

    it('does not open subpage on hover', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithNestedSubpages />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('root-surface')).toBeInTheDocument()
      })

      await user.hover(screen.getByTestId('subpage-trigger-1'))

      expect(screen.queryByTestId('subpage-surface-1')).not.toBeInTheDocument()
    })

    it('opens subpage only on selection, not on highlight', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithNestedSubpages />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('root-surface')).toBeInTheDocument()
      })

      screen.getByTestId('root-list').focus()
      await user.keyboard('{ArrowDown}')

      expect(screen.queryByTestId('subpage-surface-1')).not.toBeInTheDocument()

      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByTestId('subpage-surface-1')).toBeInTheDocument()
      })
    })

    it('sets data-navigating on popup during subpage navigation', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithNestedSubpages />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('root-surface')).toBeInTheDocument()
      })

      const popup = screen.getByRole('dialog')
      expect(popup).not.toHaveAttribute('data-navigating')

      await user.click(screen.getByTestId('subpage-trigger-1'))

      expect(popup).toHaveAttribute('data-navigating')

      await waitFor(() => {
        expect(screen.getByTestId('subpage-surface-1')).toBeInTheDocument()
      })
    })

    it('goes back one page with ArrowLeft', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithNestedSubpages />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('root-surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('subpage-trigger-1'))

      await waitFor(() => {
        expect(screen.getByTestId('subpage-surface-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('subpage-trigger-2'))

      await waitFor(() => {
        expect(screen.getByTestId('subpage-surface-2')).toBeInTheDocument()
      })

      screen.getByTestId('subpage-list-2').focus()
      await user.keyboard('{ArrowLeft}')

      await waitFor(() => {
        expect(screen.getByTestId('subpage-surface-1')).toBeInTheDocument()
        expect(
          screen.queryByTestId('subpage-surface-2'),
        ).not.toBeInTheDocument()
        expect(screen.queryByTestId('root-surface')).not.toBeInTheDocument()
      })
    })

    it('goes back one page with Ctrl+H', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithNestedSubpages />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('root-surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('subpage-trigger-1'))

      await waitFor(() => {
        expect(screen.getByTestId('subpage-surface-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('subpage-trigger-2'))

      await waitFor(() => {
        expect(screen.getByTestId('subpage-surface-2')).toBeInTheDocument()
      })

      screen.getByTestId('subpage-list-2').focus()
      await user.keyboard('{Control>}h{/Control}')

      await waitFor(() => {
        expect(screen.getByTestId('subpage-surface-1')).toBeInTheDocument()
        expect(
          screen.queryByTestId('subpage-surface-2'),
        ).not.toBeInTheDocument()
        expect(screen.queryByTestId('root-surface')).not.toBeInTheDocument()
      })
    })

    it('SubpageBack navigates back on click', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithNestedSubpages />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('root-surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('subpage-trigger-1'))

      await waitFor(() => {
        expect(screen.getByTestId('subpage-surface-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('subpage-back-button'))

      await waitFor(() => {
        expect(screen.getByTestId('root-surface')).toBeInTheDocument()
        expect(
          screen.queryByTestId('subpage-surface-1'),
        ).not.toBeInTheDocument()
      })
    })

    it('SubpageBackItem navigates back on click', async () => {
      const user = userEvent.setup()
      render(<DropdownMenuWithNestedSubpages />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('root-surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('subpage-trigger-1'))

      await waitFor(() => {
        expect(screen.getByTestId('subpage-surface-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('subpage-trigger-2'))

      await waitFor(() => {
        expect(screen.getByTestId('subpage-surface-2')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('subpage-back-item-2'))

      await waitFor(() => {
        expect(screen.getByTestId('subpage-surface-1')).toBeInTheDocument()
        expect(
          screen.queryByTestId('subpage-surface-2'),
        ).not.toBeInTheDocument()
      })
    })
  })
})
