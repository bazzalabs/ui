import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
