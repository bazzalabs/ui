import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { findPositioned } from '../../../../../test/browser.js'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import type { PopupMenuPositionerAlign } from './positioner.js'

const triggerStyle = { width: 120, height: 32 }
const popupStyle = { width: 160 }
const itemStyle = { height: 32 }

function OpenSubmenu(props: {
  align?: PopupMenuPositionerAlign
  side?: 'right' | 'bottom'
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger style={triggerStyle}>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner data-testid="root-positioner">
          <DropdownMenu.Popup style={popupStyle}>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <DropdownMenu.Submenu defaultOpen>
                  <DropdownMenu.SubmenuTrigger style={itemStyle}>
                    More
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner
                      data-testid="submenu-positioner"
                      align={props.align}
                      side={props.side}
                    >
                      <DropdownMenu.Popup style={popupStyle}>
                        <DropdownMenu.Surface>
                          <DropdownMenu.List>
                            <DropdownMenu.Item style={itemStyle}>
                              Sub item
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
    </DropdownMenu.Root>
  )
}

describe('PopupMenuPositioner data-align in the browser', () => {
  it.each([
    'start',
    'center',
    'end',
  ] as const)('renders data-align="%s" for the same align prop', async (align) => {
    render(<OpenSubmenu align={align} />)

    const positioner = await findPositioned('submenu-positioner')

    expect(positioner).toHaveAttribute('data-align', align)
  })

  it('renders data-align="list-start" for align="list-start" on a horizontal side', async () => {
    render(<OpenSubmenu align="list-start" />)

    const positioner = await findPositioned('submenu-positioner')

    expect(positioner).toHaveAttribute('data-align', 'list-start')
  })

  it('renders the start alignment Base UI used when list-start falls back on a vertical side', async () => {
    render(<OpenSubmenu align="list-start" side="bottom" />)

    const positioner = await findPositioned('submenu-positioner')

    expect(positioner).toHaveAttribute('data-align', 'start')
  })

  it('renders the default alignments: start for submenus, center for the root menu', async () => {
    render(<OpenSubmenu />)

    const submenuPositioner = await findPositioned('submenu-positioner')
    const rootPositioner = await findPositioned('root-positioner')

    expect(submenuPositioner).toHaveAttribute('data-align', 'start')
    expect(rootPositioner).toHaveAttribute('data-align', 'center')
  })
})

// The root menu sits low enough that pulling the submenu up by its header
// never runs into the viewport edge, so collision handling never moves it.
// The submenu popup has padding, a header, an optional banner, and a padded
// list, so its first row sits well below the popup's top edge.
const HEADER_HEIGHT = 40
const BANNER_HEIGHT = 24

function ListStartSubmenu(props: {
  alignOffset?: number
  banner?: boolean
  submenuDefaultOpen?: boolean
  keepMounted?: boolean
}) {
  return (
    <div style={{ paddingTop: 200 }}>
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger style={triggerStyle}>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup style={popupStyle}>
              <DropdownMenu.Surface>
                <DropdownMenu.List data-testid="root-list">
                  <DropdownMenu.Submenu
                    defaultOpen={props.submenuDefaultOpen ?? true}
                  >
                    <DropdownMenu.SubmenuTrigger
                      data-testid="submenu-trigger"
                      style={itemStyle}
                    >
                      More
                    </DropdownMenu.SubmenuTrigger>
                    <DropdownMenu.Portal keepMounted={props.keepMounted}>
                      <DropdownMenu.Positioner
                        data-testid="submenu-positioner"
                        align="list-start"
                        alignOffset={props.alignOffset}
                      >
                        <DropdownMenu.Popup
                          style={{ ...popupStyle, paddingTop: 6 }}
                        >
                          <DropdownMenu.Surface>
                            {props.banner ? (
                              <div style={{ height: BANNER_HEIGHT }}>
                                Banner
                              </div>
                            ) : null}
                            <div style={{ height: HEADER_HEIGHT }}>Header</div>
                            <DropdownMenu.List style={{ paddingTop: 4 }}>
                              <DropdownMenu.Item
                                data-testid="first-row"
                                style={itemStyle}
                              >
                                Sub item 1
                              </DropdownMenu.Item>
                              <DropdownMenu.Item style={itemStyle}>
                                Sub item 2
                              </DropdownMenu.Item>
                            </DropdownMenu.List>
                          </DropdownMenu.Surface>
                        </DropdownMenu.Popup>
                      </DropdownMenu.Positioner>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Submenu>
                  <DropdownMenu.Item style={itemStyle}>Item</DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

/** Distance from the submenu trigger's top edge to the submenu's first row. */
function firstRowOffsetFromTrigger() {
  const triggerTop = screen
    .getByTestId('submenu-trigger')
    .getBoundingClientRect().top
  const rowTop = screen.getByTestId('first-row').getBoundingClientRect().top
  return rowTop - triggerTop
}

async function expectFirstRowOffset(expected: number) {
  await vi.waitFor(() => {
    expect(Math.abs(firstRowOffsetFromTrigger() - expected)).toBeLessThan(1)
  })
}

describe('PopupMenuPositioner align="list-start" in the browser', () => {
  it('lines the first row up with the submenu trigger', async () => {
    render(<ListStartSubmenu />)
    await findPositioned('submenu-positioner')

    await expectFirstRowOffset(0)
  })

  it('adds a consumer alignOffset to the list-start offset', async () => {
    render(<ListStartSubmenu alignOffset={-4} />)
    await findPositioned('submenu-positioner')

    await expectFirstRowOffset(-4)
  })

  it('re-aligns when content above the list changes height', async () => {
    const { rerender } = render(<ListStartSubmenu />)
    await findPositioned('submenu-positioner')
    await expectFirstRowOffset(0)

    rerender(<ListStartSubmenu banner />)

    await expectFirstRowOffset(0)
  })

  // With the default portal the submenu positioner unmounts on close, so the
  // reopen measures from scratch. With `keepMounted` the same positioner
  // closes and reopens, so the alignment depends on it measuring again.
  it.each([
    ['an unmounting portal', false],
    ['a keepMounted portal', true],
  ] as const)('keeps the alignment when the submenu is closed and reopened from the keyboard, with %s', async (_, keepMounted) => {
    render(
      <ListStartSubmenu submenuDefaultOpen={false} keepMounted={keepMounted} />,
    )
    const trigger = screen.getByTestId('submenu-trigger')
    // Opening the root menu highlights its first row, the submenu trigger.
    screen.getByTestId('root-list').focus()
    await vi.waitFor(() => {
      expect(trigger).toHaveAttribute('data-highlighted')
    })

    await userEvent.keyboard('{ArrowRight}')
    const positioner = await findPositioned('submenu-positioner')
    await expectFirstRowOffset(0)

    await userEvent.keyboard('{ArrowLeft}')
    await vi.waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(document.activeElement).toBe(screen.getByTestId('root-list'))
      if (keepMounted) {
        expect(positioner).not.toBeVisible()
      } else {
        expect(positioner).not.toBeInTheDocument()
      }
    })

    await userEvent.keyboard('{ArrowRight}')
    const reopenedPositioner = await findPositioned('submenu-positioner')
    expect(reopenedPositioner === positioner).toBe(keepMounted)
    await expectFirstRowOffset(0)
  })
})
