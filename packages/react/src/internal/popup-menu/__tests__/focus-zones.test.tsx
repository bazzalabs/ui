import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../../dropdown-menu/index.js'
import type {
  ItemDef,
  NodeDef,
  SubmenuDef,
  SubpageDef,
} from '../deep-search/types.js'

const ITEM_LABELS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'] as const

function MenuItems({ prefix = 'jsx-item' }: { prefix?: string }) {
  return (
    <>
      {ITEM_LABELS.map((label, index) => (
        <DropdownMenu.Item
          key={label}
          id={`${prefix}-${index + 1}`}
          data-testid={`${prefix}-${index + 1}`}
          value={label}
        >
          {label}
        </DropdownMenu.Item>
      ))}
    </>
  )
}

function BasicJsxMenu({
  header,
  footer,
  includeInput = true,
  inputProps,
  surfaceProps,
  itemPrefix = 'jsx-item',
  onFirstItemSelect,
}: {
  header?: React.ReactNode
  footer?: React.ReactNode
  includeInput?: boolean
  inputProps?: Omit<DropdownMenu.Input.Props, 'data-testid'>
  surfaceProps?: Omit<DropdownMenu.Surface.Props, 'children'>
  itemPrefix?: string
  onFirstItemSelect?: () => void
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface" {...surfaceProps}>
              {header}
              {includeInput ? (
                <DropdownMenu.Input data-testid="menu-input" {...inputProps} />
              ) : null}
              <DropdownMenu.List data-testid="list">
                {ITEM_LABELS.map((label, index) => (
                  <DropdownMenu.Item
                    key={label}
                    id={`${itemPrefix}-${index + 1}`}
                    data-testid={`${itemPrefix}-${index + 1}`}
                    value={label}
                    onSelect={index === 0 ? onFirstItemSelect : undefined}
                  >
                    {label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.List>
              {footer}
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

async function openMenu(surfaceTestId = 'surface') {
  const user = userEvent.setup()
  await user.click(screen.getByTestId('trigger'))

  await waitFor(() => {
    expect(screen.getByTestId(surfaceTestId)).toBeInTheDocument()
  })

  return user
}

async function waitForFocus(element: HTMLElement) {
  await waitFor(() => {
    expect(element).toHaveFocus()
  })
}

async function waitForMenuInputFocus() {
  const input = screen.getByTestId('menu-input')
  await waitForFocus(input)
  return input
}

function expectAllItemsRendered(prefix = 'jsx-item') {
  for (const index of ITEM_LABELS.keys()) {
    expect(screen.getByTestId(`${prefix}-${index + 1}`)).toBeInTheDocument()
  }
}

describe('JSX mode', () => {
  it('a. cycles focus from input to footer to header and wraps in both directions', async () => {
    render(
      <BasicJsxMenu
        header={
          <DropdownMenu.Header data-testid="header">
            <button type="button" data-testid="header-button-one">
              Header action one
            </button>
            <button type="button" data-testid="header-button-two">
              Header action two
            </button>
          </DropdownMenu.Header>
        }
        footer={
          <DropdownMenu.Footer data-testid="footer">
            <button type="button" data-testid="footer-button">
              Footer action
            </button>
          </DropdownMenu.Footer>
        }
      />,
    )

    const user = await openMenu()
    const input = await waitForMenuInputFocus()

    await user.tab()
    await waitForFocus(screen.getByTestId('footer-button'))

    await user.tab()
    await waitForFocus(screen.getByTestId('header-button-one'))

    await user.tab()
    await waitForFocus(input)

    await user.tab({ shift: true })
    await waitForFocus(screen.getByTestId('header-button-one'))

    await user.tab({ shift: true })
    await waitForFocus(screen.getByTestId('footer-button'))

    await user.tab({ shift: true })
    await waitForFocus(input)
  })

  it('b. preserves the highlighted item when leaving and re-entering the primary zone', async () => {
    render(
      <BasicJsxMenu
        surfaceProps={{ autoHighlightFirst: 'jsx-item-5' }}
        footer={
          <DropdownMenu.Footer data-testid="footer">
            <button type="button" data-testid="footer-button">
              Footer action
            </button>
          </DropdownMenu.Footer>
        }
      />,
    )

    const user = await openMenu()
    const input = await waitForMenuInputFocus()
    const list = screen.getByTestId('list')

    await waitFor(() => {
      expect(screen.getByTestId('jsx-item-5')).toHaveAttribute(
        'data-highlighted',
        '',
      )
    })

    await user.keyboard('{ArrowDown}{ArrowDown}')

    await waitFor(() => {
      expect(screen.getByTestId('jsx-item-2')).toHaveAttribute(
        'data-highlighted',
        '',
      )
    })
    expect(input).toHaveAttribute('aria-activedescendant', 'jsx-item-2')

    await user.tab()

    await waitForFocus(screen.getByTestId('footer-button'))
    await waitFor(() => {
      expect(list).toHaveAttribute('data-zone-focused')
    })
    expect(input).toHaveAttribute('aria-activedescendant', 'jsx-item-2')

    await user.tab({ shift: true })

    await waitForFocus(input)
    await waitFor(() => {
      expect(list).not.toHaveAttribute('data-zone-focused')
    })

    await user.keyboard('{ArrowDown}')

    await waitFor(() => {
      expect(screen.getByTestId('jsx-item-3')).toHaveAttribute(
        'data-highlighted',
        '',
      )
    })
    expect(input).toHaveAttribute('aria-activedescendant', 'jsx-item-3')
  })

  it('c. keeps footer input typing and Enter on footer controls isolated from menu search and selection', async () => {
    const onFirstItemSelect = vi.fn()

    render(
      <BasicJsxMenu
        onFirstItemSelect={onFirstItemSelect}
        footer={
          <DropdownMenu.Footer data-testid="footer">
            <input data-testid="footer-input" aria-label="Footer input" />
            <button type="button" data-testid="footer-button">
              Footer action
            </button>
          </DropdownMenu.Footer>
        }
      />,
    )

    const user = await openMenu()
    const input = await waitForMenuInputFocus()

    await user.tab()
    const footerInput = screen.getByTestId('footer-input')
    await waitForFocus(footerInput)

    await user.type(footerInput, 'zz')

    expect(footerInput).toHaveValue('zz')
    expect(input).toHaveValue('')
    expectAllItemsRendered()

    await user.keyboard('{ArrowRight}')
    await waitForFocus(screen.getByTestId('footer-button'))

    await user.keyboard('{Enter}')

    expect(onFirstItemSelect).not.toHaveBeenCalled()
    expect(input).toHaveValue('')
    expectAllItemsRendered()
  })

  it('d. lets the no-input list tab to the footer and ArrowUp back to the last item', async () => {
    render(
      <BasicJsxMenu
        includeInput={false}
        footer={
          <DropdownMenu.Footer data-testid="footer">
            <button type="button" data-testid="footer-button">
              Footer action
            </button>
          </DropdownMenu.Footer>
        }
      />,
    )

    const user = await openMenu()
    const list = screen.getByTestId('list')
    await waitForFocus(list)

    await user.tab()
    await waitForFocus(screen.getByTestId('footer-button'))

    await user.keyboard('{ArrowUp}')

    await waitForFocus(list)
    expect(screen.getByTestId('jsx-item-5')).toHaveAttribute(
      'data-highlighted',
      '',
    )
    expect(list).toHaveAttribute('aria-activedescendant', 'jsx-item-5')
  })

  it('e. keeps hideUntilActive input hidden when typing printable characters in a footer input', async () => {
    render(
      <BasicJsxMenu
        inputProps={{ hideUntilActive: true }}
        footer={
          <DropdownMenu.Footer data-testid="footer">
            <input
              data-testid="footer-type-input"
              aria-label="Footer type input"
            />
          </DropdownMenu.Footer>
        }
      />,
    )

    const user = await openMenu()
    const list = screen.getByTestId('list')
    await waitForFocus(list)
    expect(screen.queryByTestId('menu-input')).not.toBeInTheDocument()

    await user.tab()
    const footerInput = screen.getByTestId('footer-type-input')
    await waitForFocus(footerInput)

    await user.type(footerInput, 'x')

    expect(footerInput).toHaveValue('x')
    expect(screen.queryByTestId('menu-input')).not.toBeInTheDocument()
    expectAllItemsRendered()
  })

  it('f. keeps focus on the primary target when an empty footer has no focusable children', async () => {
    render(
      <BasicJsxMenu
        footer={<DropdownMenu.Footer data-testid="empty-footer" />}
      />,
    )

    const user = await openMenu()
    const input = await waitForMenuInputFocus()
    const emptyFooter = screen.getByTestId('empty-footer')

    await user.tab()

    await waitForFocus(input)
    expect(emptyFooter).not.toContainElement(document.activeElement)
    expect(screen.getByTestId('surface')).toBeInTheDocument()
  })
})

function SubmenuScopingMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.Input data-testid="menu-input" />
              <DropdownMenu.List data-testid="root-list">
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger
                    id="root-submenu-trigger"
                    data-testid="submenu-trigger"
                    value="More"
                    delay={{ keyboard: 0 }}
                  >
                    More
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup>
                        <DropdownMenu.Surface data-testid="submenu-surface">
                          <DropdownMenu.List data-testid="submenu-list">
                            <MenuItems prefix="submenu-item" />
                          </DropdownMenu.List>
                          <DropdownMenu.Footer data-testid="submenu-footer">
                            <button
                              type="button"
                              data-testid="submenu-footer-button"
                            >
                              Submenu footer action
                            </button>
                          </DropdownMenu.Footer>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
                <DropdownMenu.Item
                  id="root-item"
                  data-testid="root-item"
                  value="Root item"
                >
                  Root item
                </DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.Footer data-testid="root-footer">
                <button type="button" data-testid="root-footer-button">
                  Root footer action
                </button>
              </DropdownMenu.Footer>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

describe('submenu scoping', () => {
  it("g. tabs to the submenu's own footer and Escape closes the whole menu tree", async () => {
    render(<SubmenuScopingMenu />)

    const user = await openMenu()
    await waitForMenuInputFocus()

    await user.keyboard('{ArrowRight}')

    await waitFor(() => {
      expect(screen.getByTestId('submenu-surface')).toBeInTheDocument()
    })
    const submenuList = screen.getByTestId('submenu-list')
    await waitForFocus(submenuList)

    await user.tab()

    await waitForFocus(screen.getByTestId('submenu-footer-button'))
    expect(screen.getByTestId('root-footer-button')).not.toHaveFocus()

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      expect(screen.queryByTestId('submenu-surface')).not.toBeInTheDocument()
    })
  })
})

function createDataItemDef(testId: string, value: string): ItemDef {
  return {
    kind: 'item',
    id: testId,
    value,
    render: ({ props }) => (
      <DropdownMenu.Item {...props} data-testid={testId}>
        {value}
      </DropdownMenu.Item>
    ),
  }
}

function createDataItems(prefix: string): ItemDef[] {
  return ITEM_LABELS.map((label, index) =>
    createDataItemDef(`${prefix}-${index + 1}`, label),
  )
}

function DataListItems() {
  const { nodes, renderNode } = DropdownMenu.useDataList()

  return <>{nodes.map(renderNode)}</>
}

function DataRootFocusZoneMenu() {
  const content = React.useMemo<NodeDef[]>(
    () => createDataItems('data-item'),
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
            <DropdownMenu.Surface data-testid="surface" content={content}>
              <DropdownMenu.Header data-testid="data-header">
                <button type="button" data-testid="data-header-button-one">
                  Header action one
                </button>
                <button type="button" data-testid="data-header-button-two">
                  Header action two
                </button>
              </DropdownMenu.Header>
              <DropdownMenu.Input data-testid="menu-input" />
              <DropdownMenu.List data-testid="data-list">
                <DataListItems />
              </DropdownMenu.List>
              <DropdownMenu.Footer data-testid="data-footer">
                <button type="button" data-testid="data-footer-button">
                  Footer action
                </button>
              </DropdownMenu.Footer>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function createDataSubmenuDef(): SubmenuDef {
  return {
    kind: 'submenu',
    id: 'data-submenu',
    value: 'More',
    nodes: createDataItems('data-submenu-item'),
    render: ({ props, nodes, renderNode }) => (
      <DropdownMenu.Submenu>
        <DropdownMenu.SubmenuTrigger
          {...props}
          data-testid="data-submenu-trigger"
          delay={{ keyboard: 0 }}
        >
          More
        </DropdownMenu.SubmenuTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface data-testid="data-submenu-surface">
                <DropdownMenu.List data-testid="data-submenu-list">
                  {nodes.map(renderNode)}
                </DropdownMenu.List>
                <DropdownMenu.Footer data-testid="data-submenu-footer">
                  <button
                    type="button"
                    data-testid="data-submenu-footer-button"
                  >
                    Submenu footer action
                  </button>
                </DropdownMenu.Footer>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    ),
  }
}

function DataSubmenuScopingMenu() {
  const content = React.useMemo<NodeDef[]>(() => [createDataSubmenuDef()], [])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface" content={content}>
              <DropdownMenu.Input data-testid="menu-input" />
              <DropdownMenu.List data-testid="data-root-list">
                <DataListItems />
              </DropdownMenu.List>
              <DropdownMenu.Footer data-testid="data-root-footer">
                <button type="button" data-testid="data-root-footer-button">
                  Root footer action
                </button>
              </DropdownMenu.Footer>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function createDataSubpageDef(): SubpageDef {
  return {
    kind: 'subpage',
    id: 'data-subpage',
    value: 'Details',
    nodes: createDataItems('data-subpage-item'),
    renderTrigger: ({ props }) => (
      <DropdownMenu.SubpageTrigger
        {...props}
        data-testid="data-subpage-trigger"
      >
        Details
      </DropdownMenu.SubpageTrigger>
    ),
    renderContent: ({ pageId, nodes, renderNode }) => (
      <DropdownMenu.Subpage pageId={pageId}>
        <DropdownMenu.Surface data-testid="data-subpage-surface">
          <DropdownMenu.List data-testid="data-subpage-list">
            <DropdownMenu.SubpageBackItem data-testid="data-subpage-back">
              Back
            </DropdownMenu.SubpageBackItem>
            {nodes.map(renderNode)}
          </DropdownMenu.List>
          <DropdownMenu.Footer data-testid="data-subpage-footer">
            <button type="button" data-testid="data-subpage-footer-button">
              Subpage footer action
            </button>
          </DropdownMenu.Footer>
        </DropdownMenu.Surface>
      </DropdownMenu.Subpage>
    ),
  }
}

function DataSubpageMenu() {
  const content = React.useMemo<NodeDef[]>(() => [createDataSubpageDef()], [])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface" content={content}>
              <DropdownMenu.Input data-testid="menu-input" />
              <DropdownMenu.List data-testid="data-root-list">
                <DataListItems />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

describe('data-driven mode', () => {
  it('h. cycles focus through root Surface children zones around a data List', async () => {
    render(<DataRootFocusZoneMenu />)

    const user = await openMenu()
    const input = await waitForMenuInputFocus()

    await user.tab()
    await waitForFocus(screen.getByTestId('data-footer-button'))

    await user.tab()
    await waitForFocus(screen.getByTestId('data-header-button-one'))

    await user.tab()
    await waitForFocus(input)

    await user.tab({ shift: true })
    await waitForFocus(screen.getByTestId('data-header-button-one'))

    await user.tab({ shift: true })
    await waitForFocus(screen.getByTestId('data-footer-button'))

    await user.tab({ shift: true })
    await waitForFocus(input)
  })

  it("i. scopes SubmenuDef.render focus zones to the submenu's Surface", async () => {
    render(<DataSubmenuScopingMenu />)

    const user = await openMenu()
    await waitForMenuInputFocus()
    await waitFor(() => {
      expect(screen.getByTestId('data-submenu-trigger')).toHaveAttribute(
        'data-highlighted',
        '',
      )
    })

    await user.keyboard('{ArrowRight}')

    await waitFor(() => {
      expect(screen.getByTestId('data-submenu-surface')).toBeInTheDocument()
    })
    await waitForFocus(screen.getByTestId('data-submenu-list'))

    await user.tab()

    await waitForFocus(screen.getByTestId('data-submenu-footer-button'))
    expect(screen.getByTestId('data-root-footer-button')).not.toHaveFocus()
  })

  it("j. tabs from a SubpageDef's primary list to its footer and back", async () => {
    render(<DataSubpageMenu />)

    const user = await openMenu()
    await waitForMenuInputFocus()
    await waitFor(() => {
      expect(screen.getByTestId('data-subpage-trigger')).toHaveAttribute(
        'data-highlighted',
        '',
      )
    })

    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByTestId('data-subpage-surface')).toBeInTheDocument()
    })
    const subpageList = screen.getByTestId('data-subpage-list')
    await waitForFocus(subpageList)

    await user.tab()
    await waitForFocus(screen.getByTestId('data-subpage-footer-button'))

    await user.tab({ shift: true })
    await waitForFocus(subpageList)
  })
})

describe('auto-focus regression (UI-337)', () => {
  it('k. focuses the library Input instead of a consumer Header input when both exist', async () => {
    render(
      <BasicJsxMenu
        header={
          <DropdownMenu.Header data-testid="header">
            <input data-testid="header-input" aria-label="Header input" />
          </DropdownMenu.Header>
        }
      />,
    )

    await openMenu()

    const libraryInput = screen.getByTestId('menu-input')
    await waitForFocus(libraryInput)

    expect(libraryInput).toHaveAttribute('data-popup-menu-input')
    expect(document.querySelector('[data-popup-menu-input]')).toBe(libraryInput)
    expect(screen.getByTestId('header-input')).not.toHaveFocus()
  })

  it('l. focuses the list instead of a consumer Header input when no library Input exists', async () => {
    render(
      <BasicJsxMenu
        includeInput={false}
        header={
          <DropdownMenu.Header data-testid="header">
            <input data-testid="header-input" aria-label="Header input" />
          </DropdownMenu.Header>
        }
      />,
    )

    await openMenu()

    await waitForFocus(screen.getByTestId('list'))
    expect(screen.getByTestId('header-input')).not.toHaveFocus()
  })
})
