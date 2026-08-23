import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import type {
  GroupDef,
  ItemDef,
  NodeDef,
  RadioGroupDef,
  RadioItemDef,
  SubmenuDef,
  SubpageDef,
} from '../types.js'

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Creates an ItemDef with a render function that includes data-testid.
 * Note: Does NOT set explicit `id` so that defaultGetQualifiedRowId generates
 * composite IDs from breadcrumbs + value during deep search.
 */
function createTestItemDef(
  testId: string,
  value: string,
  options: Partial<ItemDef> = {},
): ItemDef {
  return {
    kind: 'item',
    // Note: No explicit `id` - allows composite ID generation from breadcrumbs + value
    value,
    render: ({ props, context }) => (
      <DropdownMenu.Item
        {...props}
        data-testid={`item-${testId}`}
        data-value={context.value}
      >
        {value}
      </DropdownMenu.Item>
    ),
    ...options,
  }
}

/**
 * Creates a SubmenuDef with child nodes
 */
function createTestSubmenuDef(
  id: string,
  value: string,
  nodes: NodeDef[],
  options: Partial<SubmenuDef> = {},
): SubmenuDef {
  return {
    kind: 'submenu',
    id,
    value,
    nodes,
    render: ({ props, context, renderNode }) => (
      <DropdownMenu.Submenu>
        <DropdownMenu.SubmenuTrigger
          {...props}
          data-testid={`submenu-trigger-${id}`}
          data-value={context.value}
        >
          {value}
        </DropdownMenu.SubmenuTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>{nodes.map(renderNode)}</DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    ),
    ...options,
  }
}

function createTestSubpageDef(
  id: string,
  value: string,
  nodes: NodeDef[],
): SubpageDef {
  return {
    kind: 'subpage',
    id,
    value,
    nodes,
    renderTrigger: ({ props, context }) => (
      <DropdownMenu.SubpageTrigger
        {...props}
        data-testid={`subpage-trigger-${id}`}
        data-value={context.value}
      >
        {value}
      </DropdownMenu.SubpageTrigger>
    ),
    renderContent: ({ pageId, nodes: childNodes, renderNode }) => (
      <DropdownMenu.Subpage pageId={pageId}>
        <DropdownMenu.Surface data-testid={`subpage-surface-${id}`}>
          <DropdownMenu.List>
            <DropdownMenu.SubpageBackItem data-testid={`subpage-back-${id}`}>
              Back
            </DropdownMenu.SubpageBackItem>
            {childNodes.map(renderNode)}
          </DropdownMenu.List>
        </DropdownMenu.Surface>
      </DropdownMenu.Subpage>
    ),
  }
}

function ListItems() {
  const { nodes, renderNode } = DropdownMenu.useDataList()

  return <>{nodes.map(renderNode)}</>
}

function ListItemsWithCount() {
  const { nodes, renderNode, count } = DropdownMenu.useDataList()

  return (
    <>
      <div data-testid="count">{count}</div>
      {nodes.map(renderNode)}
    </>
  )
}

function MenuWithDataContent({ content }: { content: NodeDef[] }) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface content={content}>
              <DropdownMenu.List>
                <ListItems />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Menu with Surface that has items with duplicate IDs across submenus.
 * This covers duplicate definition values across submenus.
 */
function MenuWithDuplicateIds({
  onSelectStatus,
  onSelectProjectStatus,
}: {
  onSelectStatus?: () => void
  onSelectProjectStatus?: () => void
}) {
  const content: NodeDef[] = React.useMemo(
    () => [
      createTestSubmenuDef('status', 'Status', [
        {
          ...createTestItemDef('backlog', 'Backlog'),
          onSelect: onSelectStatus,
        },
        createTestItemDef('in-progress', 'In Progress'),
        createTestItemDef('done', 'Done'),
      ]),
      createTestSubmenuDef('project-status', 'Project Status', [
        {
          ...createTestItemDef('backlog', 'Backlog'), // Same ID as in Status!
          onSelect: onSelectProjectStatus,
        },
        createTestItemDef('active', 'Active'),
        createTestItemDef('archived', 'Archived'),
      ]),
    ],
    [onSelectStatus, onSelectProjectStatus],
  )

  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              data-testid="surface"
              content={content}
              deepSearch={{ enabled: true, minLength: 0 }}
            >
              <DropdownMenu.Input
                data-testid="search-input"
                placeholder="Search..."
              />
              <DropdownMenu.List>
                <ListItemsWithCount />
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty">
                No results
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Menu with flat items (no submenus) for basic ID testing.
 */
function MenuWithFlatItems() {
  const content: NodeDef[] = React.useMemo(
    () => [
      createTestItemDef('apple', 'Apple'),
      createTestItemDef('banana', 'Banana'),
      createTestItemDef('cherry', 'Cherry'),
    ],
    [],
  )

  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              data-testid="surface"
              content={content}
              deepSearch={{ enabled: true }}
            >
              <DropdownMenu.List>
                <ListItems />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function MenuWithForcedSorting() {
  const content: NodeDef[] = React.useMemo(
    () => [
      createTestSubmenuDef('settings', 'Settings', [], {
        forceOrder: -10,
        forceScore: 100,
      }),
      createTestItemDef('early', 'Early', {
        forceOrder: -10,
        forceScore: 1,
      }),
      createTestItemDef('late', 'Late', {
        forceOrder: 10,
        forceScore: 999,
      }),
    ],
    [],
  )

  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              data-testid="surface"
              content={content}
              deepSearch={{
                enabled: true,
                minLength: 0,
                groupSearchBehavior: 'flatten',
              }}
              defaultSearch="x"
            >
              <DropdownMenu.Input data-testid="search-input" />
              <DropdownMenu.List>
                <ListItems />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

// ============================================================================
// Tests
// ============================================================================

describe('useDataList', () => {
  it('warns for duplicate id-less values in one surface', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <MenuWithDataContent
        content={[
          createTestItemDef('first', 'Same'),
          createTestItemDef('second', 'Same'),
        ]}
      />,
    )

    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[PopupMenu] Duplicate row id "same" resolved for multiple rows in the same menu',
        ),
      ),
    )
    expect(
      warn.mock.calls.filter(([message]) =>
        String(message).startsWith('[PopupMenu] Duplicate row id'),
      ),
    ).toHaveLength(1)
  })

  it('does not warn for a clean menu with respect to duplicate row ids', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<MenuWithFlatItems />)

    await waitFor(() =>
      expect(screen.getByTestId('item-apple')).toBeInTheDocument(),
    )

    expect(
      warn.mock.calls.some(([message]) =>
        String(message).startsWith('[PopupMenu] Duplicate row id'),
      ),
    ).toBe(false)
  })

  it('lets a child component read and render nodes', async () => {
    render(<MenuWithDuplicateIds />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
      expect(screen.getByTestId('submenu-trigger-status')).toBeInTheDocument()
      expect(
        screen.getByTestId('submenu-trigger-project-status'),
      ).toBeInTheDocument()
    })
  })

  it('updates nodes seen by a child component when search changes', async () => {
    const user = userEvent.setup()
    render(<MenuWithDuplicateIds />)

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('search-input'), 'backlog')

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
      expect(screen.getAllByTestId('item-backlog')).toHaveLength(2)
    })
  })

  it('throws outside a List', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    function ReadListOutsideProvider() {
      DropdownMenu.useDataList()
      return null
    }

    expect(() => render(<ReadListOutsideProvider />)).toThrow(
      'useDataList must be used within a List component',
    )

    consoleError.mockRestore()
  })
})

describe('DOM ID verification', () => {
  it('renders items with their node.value as DOM id at root level', async () => {
    render(<MenuWithFlatItems />)

    // Wait for items to be visible (menu is defaultOpen)
    await waitFor(() => {
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
    })

    // Items at root level should have slugified IDs
    const apple = screen.getByTestId('item-apple')
    const banana = screen.getByTestId('item-banana')
    const cherry = screen.getByTestId('item-cherry')

    expect(apple).toHaveAttribute('id', 'apple')
    expect(banana).toHaveAttribute('id', 'banana')
    expect(cherry).toHaveAttribute('id', 'cherry')
  })

  it('renders items with composite IDs when surfaced from submenus', async () => {
    const user = userEvent.setup()
    render(<MenuWithDuplicateIds />)

    // Wait for menu to open (defaultOpen)
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })

    // Search for "backlog" to surface items from both submenus
    const input = screen.getByTestId('search-input')
    await user.type(input, 'backlog')

    // Wait for search results
    await waitFor(() => {
      // Both "backlog" items should be visible with different composite IDs
      const items = screen.getAllByText('Backlog')
      expect(items.length).toBe(2)
    })

    // Find items by their composite IDs (slugified)
    const statusBacklog = document.getElementById('status.backlog')
    const projectStatusBacklog = document.getElementById(
      'project-status.backlog',
    )

    expect(statusBacklog).toBeInTheDocument()
    expect(projectStatusBacklog).toBeInTheDocument()
    expect(statusBacklog).not.toBe(projectStatusBacklog)
  })

  it('preserves value in render context', async () => {
    const user = userEvent.setup()
    render(<MenuWithDuplicateIds />)

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })

    // Search for "backlog"
    const input = screen.getByTestId('search-input')
    await user.type(input, 'backlog')

    await waitFor(() => {
      const items = screen.getAllByText('Backlog')
      expect(items.length).toBe(2)
    })

    // Both items should have data-value="Backlog" (the original value)
    const statusBacklog = document.getElementById('status.backlog')
    const projectStatusBacklog = document.getElementById(
      'project-status.backlog',
    )

    expect(statusBacklog).toHaveAttribute('data-value', 'Backlog')
    expect(projectStatusBacklog).toHaveAttribute('data-value', 'Backlog')
  })
})

describe('deep search duplicate ID scenario', () => {
  it('handles keyboard navigation with duplicate local IDs', async () => {
    const user = userEvent.setup()
    render(<MenuWithDuplicateIds />)

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })

    // Search for "backlog"
    const input = screen.getByTestId('search-input')
    await user.type(input, 'backlog')

    await waitFor(() => {
      const items = screen.getAllByText('Backlog')
      expect(items.length).toBe(2)
    })

    // First item should auto-highlight after search
    // Wait for auto-highlight to settle
    await waitFor(() => {
      const statusBacklog = document.getElementById('status.backlog')
      expect(statusBacklog).toHaveAttribute('data-highlighted', '')
    })

    // Navigate down - should highlight second item (project-status.backlog)
    await user.keyboard('{ArrowDown}')

    await waitFor(() => {
      const projectStatusBacklog = document.getElementById(
        'project-status.backlog',
      )
      expect(projectStatusBacklog).toHaveAttribute('data-highlighted', '')
    })

    const statusBacklog = document.getElementById('status.backlog')
    expect(statusBacklog).not.toHaveAttribute('data-highlighted')
  })

  it('triggers correct onSelect for items with duplicate local IDs', async () => {
    const user = userEvent.setup()
    const onSelectStatus = vi.fn()
    const onSelectProjectStatus = vi.fn()

    render(
      <MenuWithDuplicateIds
        onSelectStatus={onSelectStatus}
        onSelectProjectStatus={onSelectProjectStatus}
      />,
    )

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })

    // Search for "backlog"
    const input = screen.getByTestId('search-input')
    await user.type(input, 'backlog')

    await waitFor(() => {
      const items = screen.getAllByText('Backlog')
      expect(items.length).toBe(2)
    })

    // Click the first backlog (status.backlog)
    const statusBacklog = document.getElementById('status.backlog')
    await user.click(statusBacklog!)

    expect(onSelectStatus).toHaveBeenCalledTimes(1)
    expect(onSelectProjectStatus).not.toHaveBeenCalled()
  })

  it('aria-activedescendant uses composite ID', async () => {
    const user = userEvent.setup()
    render(<MenuWithDuplicateIds />)

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })

    // Search for "backlog"
    const input = screen.getByTestId('search-input')
    await user.type(input, 'backlog')

    await waitFor(() => {
      const items = screen.getAllByText('Backlog')
      expect(items.length).toBe(2)
    })

    // First item should be auto-highlighted after search
    // The aria-activedescendant is set on the input (combobox role)
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-activedescendant', 'status.backlog')
    })

    // Navigate down to second item
    await user.keyboard('{ArrowDown}')

    await waitFor(() => {
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        'project-status.backlog',
      )
    })
  })
})

function NestedSurfaceMenu({
  ancestorId,
  duplicateId,
}: {
  ancestorId?: string
  duplicateId?: string
}) {
  const content: NodeDef[] = React.useMemo(() => {
    const leaf = createTestItemDef('leaf', 'Leaf', { id: duplicateId })
    const submenuB: SubmenuDef = {
      kind: 'submenu',
      id: 'b',
      value: 'B',
      nodes: [leaf],
      render: ({ props, context, nodes }) => (
        <DropdownMenu.Submenu>
          <DropdownMenu.SubmenuTrigger
            {...props}
            data-testid="nested-trigger-b"
          >
            {context.value}
          </DropdownMenu.SubmenuTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface content={nodes}>
                  <DropdownMenu.List>
                    <ListItems />
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Submenu>
      ),
    }
    const submenuA: SubmenuDef = {
      kind: 'submenu',
      id: ancestorId,
      value: 'A',
      nodes: [submenuB],
      render: ({ props, context, nodes }) => (
        <DropdownMenu.Submenu>
          <DropdownMenu.SubmenuTrigger
            {...props}
            data-testid="nested-trigger-a"
          >
            {context.value}
          </DropdownMenu.SubmenuTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface content={nodes}>
                  <DropdownMenu.List>
                    <ListItems />
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Submenu>
      ),
    }
    return [
      ...(duplicateId
        ? [createTestItemDef('root-duplicate', 'Root', { id: duplicateId })]
        : []),
      submenuA,
    ]
  }, [ancestorId, duplicateId])

  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              content={content}
              deepSearch={{ enabled: true, minLength: 1 }}
            >
              <DropdownMenu.Input data-testid="nested-search-input" />
              <DropdownMenu.List>
                <ListItems />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

it('warns when nested surfaces share an explicit row id', async () => {
  const user = userEvent.setup()
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  render(<NestedSurfaceMenu duplicateId="shared-row" />)
  await user.hover(screen.getByTestId('nested-trigger-a'))
  await waitFor(() =>
    expect(screen.getByTestId('nested-trigger-b')).toBeInTheDocument(),
  )
  await user.hover(screen.getByTestId('nested-trigger-b'))
  await waitFor(() =>
    expect(screen.getByTestId('item-leaf')).toBeInTheDocument(),
  )

  expect(
    warn.mock.calls.filter(([message]) =>
      String(message).startsWith('[PopupMenu] Duplicate row id'),
    ),
  ).toHaveLength(1)
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining(
      '[PopupMenu] Duplicate row id "shared-row" resolved for multiple rows in the same menu',
    ),
  )
})

describe('edge cases', () => {
  it('handles empty search results', async () => {
    const user = userEvent.setup()
    render(<MenuWithDuplicateIds />)

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })

    const input = screen.getByTestId('search-input')
    await user.type(input, 'nonexistent')

    // Should show empty state, no crash
    await waitFor(() => {
      expect(screen.getByTestId('empty')).toBeInTheDocument()
    })

    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })

  it('handles clearing search after deep search', async () => {
    const user = userEvent.setup()
    render(<MenuWithDuplicateIds />)

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })

    const input = screen.getByTestId('search-input')

    // Search for "backlog"
    await user.type(input, 'backlog')
    await waitFor(() => {
      expect(screen.getAllByText('Backlog').length).toBe(2)
    })

    // Clear search
    await user.clear(input)

    // Should go back to browse mode showing submenu triggers
    await waitFor(() => {
      expect(screen.getByTestId('submenu-trigger-status')).toBeInTheDocument()
      expect(
        screen.getByTestId('submenu-trigger-project-status'),
      ).toBeInTheDocument()
    })
  })

  it('handles values with special characters', async () => {
    const contentWithSpecialChars: NodeDef[] = [
      createTestSubmenuDef('my-submenu', 'My Submenu', [
        createTestItemDef('item_with_underscore', 'Item With Underscore'),
        createTestItemDef('item-with-dashes', 'Item With Dashes'),
      ]),
    ]

    function MenuWithSpecialChars() {
      return (
        <DropdownMenu.Root defaultOpen>
          <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface
                  content={contentWithSpecialChars}
                  deepSearch={{ enabled: true, minLength: 0 }}
                >
                  <DropdownMenu.Input
                    data-testid="search-input"
                    placeholder="Search..."
                  />
                  <DropdownMenu.List>
                    <ListItems />
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }

    const user = userEvent.setup()
    render(<MenuWithSpecialChars />)

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })

    const input = screen.getByTestId('search-input')
    await user.type(input, 'item')

    await waitFor(() => {
      expect(screen.getByText('Item With Underscore')).toBeInTheDocument()
      expect(screen.getByText('Item With Dashes')).toBeInTheDocument()
    })

    // Verify composite IDs are slugified
    const underscoreItem = document.getElementById(
      'my-submenu.item-with-underscore',
    )
    const dashItem = document.getElementById('my-submenu.item-with-dashes')

    expect(underscoreItem).toBeInTheDocument()
    expect(dashItem).toBeInTheDocument()
  })
})

describe('forced sorting', () => {
  it('orders rendered rows by forceOrder before score', async () => {
    render(<MenuWithForcedSorting />)

    await waitFor(() => {
      expect(screen.getByTestId('item-early')).toBeInTheDocument()
      expect(screen.getByTestId('submenu-trigger-settings')).toBeInTheDocument()
      expect(screen.getByTestId('item-late')).toBeInTheDocument()
    })

    const listbox = screen.getByRole('listbox')
    const renderedOrder = Array.from(
      listbox.querySelectorAll('[role="option"], [role="menuitem"]'),
    ).map((element) => element.getAttribute('data-testid'))

    expect(renderedOrder).toEqual([
      'item-early',
      'submenu-trigger-settings',
      'item-late',
    ])
  })
})

describe('group labels', () => {
  const groupItem = createTestItemDef('group-item', 'Group Item')

  function createGroup(options: Partial<GroupDef> = {}): GroupDef {
    return {
      kind: 'group',
      id: 'test-group',
      label: 'Group Label',
      nodes: [groupItem],
      ...options,
    }
  }

  function createRadioGroup(
    options: Partial<RadioGroupDef> = {},
  ): RadioGroupDef {
    const radioItem: RadioItemDef = {
      kind: 'radio-item',
      value: 'one',
      render: ({ props }) => <div {...props}>One</div>,
    }

    return {
      kind: 'radio-group',
      id: 'test-radio-group',
      label: 'Radio Group Label',
      nodes: [radioItem],
      ...options,
    }
  }

  it('renders a visible default label for a group', async () => {
    render(<MenuWithDataContent content={[createGroup()]} />)

    await waitFor(() => {
      expect(
        screen.getByText('Group Label', {
          selector: '[bazzaui-dropdown-menu-group-label]',
        }),
      ).toBeInTheDocument()
    })
  })

  it('renders a custom group label and passes its stable id', async () => {
    const renderLabel = vi.fn(({ props }: { props: { id: string } }) => (
      <div data-testid="custom-group-label" {...props} />
    ))

    render(<MenuWithDataContent content={[createGroup({ renderLabel })]} />)

    await waitFor(() => {
      expect(screen.getByTestId('custom-group-label')).toBeInTheDocument()
    })
    expect(renderLabel).toHaveBeenCalledWith(
      expect.objectContaining({
        props: { id: expect.stringMatching(/-label$/) },
      }),
    )
    expect(
      screen.queryByText('Group Label', {
        selector: '[bazzaui-dropdown-menu-group-label]',
      }),
    ).not.toBeInTheDocument()
  })

  it('prefers the container render over renderLabel', async () => {
    const renderLabel = vi.fn(() => <div data-testid="custom-group-label" />)

    render(
      <MenuWithDataContent
        content={[
          createGroup({
            render: ({ children }) => (
              <div data-testid="custom-group-container">{children}</div>
            ),
            renderLabel,
          }),
        ]}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('custom-group-container')).toBeInTheDocument()
    })
    expect(renderLabel).not.toHaveBeenCalled()
  })

  it('renders a visible default label for a radio group', async () => {
    render(<MenuWithDataContent content={[createRadioGroup()]} />)

    await waitFor(() => {
      const radioGroup = screen.getByRole('radiogroup')
      expect(
        radioGroup.querySelector('[bazzaui-dropdown-menu-group-label]'),
      ).toHaveTextContent('Radio Group Label')
    })
  })
})

describe('Subpages', () => {
  function MenuWithSubpages() {
    const content: NodeDef[] = React.useMemo(
      () => [
        createTestSubpageDef('ai-filter', 'AI Filter', [
          createTestItemDef('assigned-to-me', 'assigned to me'),
          createTestItemDef(
            'completed-last-month',
            'completed in the last month',
          ),
        ]),
      ],
      [],
    )

    return (
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface
                content={content}
                deepSearch={{ enabled: true, minLength: 0 }}
              >
                <DropdownMenu.Input
                  data-testid="search-input"
                  placeholder="Search..."
                />
                <DropdownMenu.List>
                  <ListItems />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  function MenuWithNestedSubpage() {
    const content: NodeDef[] = React.useMemo(
      () => [
        createTestSubmenuDef('filters', 'Filters', [
          createTestSubpageDef('ai-filter-nested', 'AI Filter', [
            createTestItemDef('due-next-two-weeks', 'due in the next 2 weeks'),
          ]),
        ]),
      ],
      [],
    )

    return (
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface
                content={content}
                deepSearch={{ enabled: true, minLength: 0 }}
              >
                <DropdownMenu.Input
                  data-testid="search-input"
                  placeholder="Search..."
                />
                <DropdownMenu.List>
                  <ListItems />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  it('renders subpage content via Subpages and navigates back', async () => {
    const user = userEvent.setup()
    render(<MenuWithSubpages />)

    await waitFor(() => {
      expect(
        screen.getByTestId('subpage-trigger-ai-filter'),
      ).toBeInTheDocument()
    })

    expect(screen.queryByText('assigned to me')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('subpage-trigger-ai-filter'))

    await waitFor(() => {
      expect(screen.getByText('assigned to me')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('subpage-back-ai-filter'))

    await waitFor(() => {
      expect(
        screen.getByTestId('subpage-trigger-ai-filter'),
      ).toBeInTheDocument()
    })
    expect(screen.queryByText('assigned to me')).not.toBeInTheDocument()
  })

  it('supports nested subpages surfaced by deep search', async () => {
    const user = userEvent.setup()
    render(<MenuWithNestedSubpage />)

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })

    const input = screen.getByTestId('search-input')
    await user.type(input, 'AI Filter')

    await waitFor(() => {
      expect(
        screen.getByTestId('subpage-trigger-ai-filter-nested'),
      ).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('subpage-trigger-ai-filter-nested'))

    await waitFor(() => {
      expect(screen.getByText('due in the next 2 weeks')).toBeInTheDocument()
    })
  })
})

describe('resolved row ids', () => {
  function ResolvedRowsMenu({
    search = false,
    getRowId,
  }: {
    search?: boolean
    getRowId?: (node: { def: NodeDef; defPath: string[] }) => string
  }) {
    const content = React.useMemo(
      () => [
        createTestSubmenuDef('status', 'Status', [
          createTestItemDef('backlog', 'Backlog'),
        ]),
        createTestSubpageDef('details', 'Details', [
          createTestItemDef('assigned-to-me', 'Assigned to me'),
        ]),
      ],
      [],
    )

    return (
      <DropdownMenu.Root defaultOpen getRowId={getRowId}>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface
                content={content}
                deepSearch={
                  search ? { enabled: true, minLength: 1 } : undefined
                }
              >
                {search && <DropdownMenu.Input aria-label="Search" />}
                <DropdownMenu.List>
                  <ListItems />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  it('uses definition paths for nested browse row ids', async () => {
    const user = userEvent.setup()
    render(<ResolvedRowsMenu />)
    await user.hover(screen.getByTestId('submenu-trigger-status'))
    await waitFor(() =>
      expect(screen.getByTestId('item-backlog')).toHaveAttribute(
        'id',
        'status.backlog',
      ),
    )
  })

  it('keeps nested row ids while deep-searching', async () => {
    const user = userEvent.setup()
    render(<ResolvedRowsMenu search />)
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'backlog')
    await waitFor(() =>
      expect(screen.getByTestId('item-backlog')).toHaveAttribute(
        'id',
        'status.backlog',
      ),
    )
  })

  it('uses the root getRowId seam for rendered rows', async () => {
    const user = userEvent.setup()
    render(
      <ResolvedRowsMenu
        search
        getRowId={(node) => `x-${node.def.id ?? node.defPath.join('.')}`}
      />,
    )
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'backlog')
    await waitFor(() =>
      expect(screen.getByTestId('item-backlog').id).toBe('x-status.backlog'),
    )
  })

  it('uses subpage-qualified ids and the root getRowId seam for subpage rows', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<ResolvedRowsMenu />)
    await user.click(screen.getByTestId('subpage-trigger-details'))
    await waitFor(() =>
      expect(screen.getByTestId('item-assigned-to-me')).toHaveAttribute(
        'id',
        'details.assigned-to-me',
      ),
    )

    unmount()
    render(
      <ResolvedRowsMenu
        getRowId={(node) => `x-${node.def.id ?? node.defPath.join('.')}`}
      />,
    )
    await user.click(screen.getByTestId('subpage-trigger-details'))
    await waitFor(() =>
      expect(screen.getByTestId('item-assigned-to-me').id).toBe(
        'x-details.assigned-to-me',
      ),
    )
  })
})
