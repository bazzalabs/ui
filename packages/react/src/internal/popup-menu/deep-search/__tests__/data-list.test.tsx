import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import type {
  GetQualifiedRowIdContext,
  GetQualifiedRowIdFn,
  ItemDef,
  NodeDef,
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

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Menu with Surface that has items with duplicate IDs across submenus.
 * This is the core problem that getQualifiedRowId() solves.
 */
function MenuWithDuplicateIds({
  getQualifiedRowId,
  onSelectStatus,
  onSelectProjectStatus,
}: {
  getQualifiedRowId?: GetQualifiedRowIdFn
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
              getQualifiedRowId={getQualifiedRowId}
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
function MenuWithFlatItems({
  getQualifiedRowId,
}: {
  getQualifiedRowId?: GetQualifiedRowIdFn
}) {
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
              getQualifiedRowId={getQualifiedRowId}
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

/**
 * Menu for testing custom getQualifiedRowId function.
 */
function MenuWithCustomGetQualifiedRowId({
  getQualifiedRowId,
  getQualifiedRowIdSpy,
}: {
  getQualifiedRowId: GetQualifiedRowIdFn
  getQualifiedRowIdSpy?: (ctx: GetQualifiedRowIdContext) => void
}) {
  const wrappedGetQualifiedRowId: GetQualifiedRowIdFn = React.useCallback(
    (ctx) => {
      getQualifiedRowIdSpy?.(ctx)
      return getQualifiedRowId(ctx)
    },
    [getQualifiedRowId, getQualifiedRowIdSpy],
  )

  const content: NodeDef[] = React.useMemo(
    () => [
      createTestSubmenuDef('settings', 'Settings', [
        createTestItemDef('theme', 'Theme'),
        createTestItemDef('language', 'Language'),
      ]),
      createTestItemDef('help', 'Help'),
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
              deepSearch={{ enabled: true, minLength: 0 }}
              getQualifiedRowId={wrappedGetQualifiedRowId}
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

describe('List getQualifiedRowId', () => {
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

  describe('custom getQualifiedRowId function', () => {
    it('uses custom function for ID generation', async () => {
      const user = userEvent.setup()

      // Custom function that uses "/" as separator
      const customGetQualifiedRowId: GetQualifiedRowIdFn = (ctx) => {
        if (ctx.breadcrumbs.length > 0) {
          return [...ctx.breadcrumbs.map((b) => b.value), ctx.value].join('/')
        }
        return ctx.value
      }

      render(
        <MenuWithCustomGetQualifiedRowId
          getQualifiedRowId={customGetQualifiedRowId}
        />,
      )

      // Wait for menu to open
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      // Search for "theme" to surface item from submenu
      const input = screen.getByTestId('search-input')
      await user.type(input, 'theme')

      await waitFor(() => {
        expect(screen.getByText('Theme')).toBeInTheDocument()
      })

      // Item should have custom composite ID with "/" separator
      const themeItem = document.getElementById('Settings/Theme')
      expect(themeItem).toBeInTheDocument()
    })

    it('calls custom function with correct context', async () => {
      const user = userEvent.setup()
      const getQualifiedRowIdSpy = vi.fn()

      const customGetQualifiedRowId: GetQualifiedRowIdFn = (ctx) => {
        if (ctx.breadcrumbs.length > 0) {
          return [...ctx.breadcrumbs.map((b) => b.value), ctx.value].join('.')
        }
        return ctx.value
      }

      render(
        <MenuWithCustomGetQualifiedRowId
          getQualifiedRowId={customGetQualifiedRowId}
          getQualifiedRowIdSpy={getQualifiedRowIdSpy}
        />,
      )

      // Wait for menu to open
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      // Search to trigger deep search and ID generation
      const input = screen.getByTestId('search-input')
      await user.type(input, 'theme')

      await waitFor(() => {
        expect(screen.getByText('Theme')).toBeInTheDocument()
      })

      // Find the call for the "Theme" item - look for calls where query contains 'theme' (case insensitive)
      // The spy is called incrementally as the user types, so we need to find the right call
      const themeCall = getQualifiedRowIdSpy.mock.calls.find(
        (call) =>
          call[0].value === 'Theme' &&
          call[0].search?.query?.toLowerCase().includes('theme'),
      )

      expect(themeCall).toBeDefined()
      const ctx = themeCall![0] as GetQualifiedRowIdContext

      // Verify context fields
      expect(ctx.value).toBe('Theme')
      expect(ctx.breadcrumbs.map((b) => b.value)).toEqual(['Settings'])
      expect(ctx.isDeepSearchResult).toBe(true)
      // The query should contain 'theme' at some point
      expect(ctx.search?.query.toLowerCase()).toContain('theme')
    })

    it('custom function can include index for uniqueness', async () => {
      const user = userEvent.setup()

      // Custom function that uses index prefix
      const customGetQualifiedRowId: GetQualifiedRowIdFn = (ctx) => {
        return `item-${ctx.index}-${ctx.value}`
      }

      render(
        <MenuWithCustomGetQualifiedRowId
          getQualifiedRowId={customGetQualifiedRowId}
        />,
      )

      // Wait for menu to open
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      // Without search, items are just the submenu triggers and root items
      // With search, we get deep items
      const input = screen.getByTestId('search-input')
      await user.type(input, 'help')

      await waitFor(() => {
        expect(screen.getByText('Help')).toBeInTheDocument()
      })

      // Help is a root item, so should have index-based ID
      // The exact index depends on implementation but should follow pattern
      const helpItem = screen.getByText('Help').closest('[role="option"]')
      expect(helpItem?.id).toMatch(/^item-\d+-Help$/)
    })
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
        expect(
          screen.getByTestId('submenu-trigger-settings'),
        ).toBeInTheDocument()
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
          <DropdownMenu.Trigger data-testid="trigger">
            Open
          </DropdownMenu.Trigger>
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
              createTestItemDef(
                'due-next-two-weeks',
                'due in the next 2 weeks',
              ),
            ]),
          ]),
        ],
        [],
      )

      return (
        <DropdownMenu.Root defaultOpen>
          <DropdownMenu.Trigger data-testid="trigger">
            Open
          </DropdownMenu.Trigger>
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
})
