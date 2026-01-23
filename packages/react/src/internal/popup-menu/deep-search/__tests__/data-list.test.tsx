import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import type {
  GetItemIdContext,
  GetItemIdFn,
  ItemDef,
  NodeDef,
  SubmenuDef,
} from '../types.js'

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Creates an ItemDef with a render function that includes data-testid
 */
function createTestItemDef(
  id: string,
  value: string,
  options: Partial<ItemDef> = {},
): ItemDef {
  return {
    kind: 'item',
    id,
    value,
    render: ({ props, context }) => (
      <DropdownMenu.Item
        {...props}
        data-testid={`item-${id}`}
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
  }
}

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Menu with DataSurface that has items with duplicate IDs across submenus.
 * This is the core problem that getItemId() solves.
 */
function MenuWithDuplicateIds({
  getItemId,
  onSelectStatus,
  onSelectProjectStatus,
}: {
  getItemId?: GetItemIdFn
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
            <DropdownMenu.DataSurface
              data-testid="surface"
              content={content}
              deepSearch={{ enabled: true, minLength: 0 }}
              getItemId={getItemId}
            >
              <DropdownMenu.DataInput
                data-testid="search-input"
                placeholder="Search..."
              />
              <DropdownMenu.DataList>
                {({ nodes, renderNode, count }) => (
                  <>
                    <div data-testid="count">{count}</div>
                    {nodes.map(renderNode)}
                  </>
                )}
              </DropdownMenu.DataList>
              <DropdownMenu.Empty data-testid="empty">
                No results
              </DropdownMenu.Empty>
            </DropdownMenu.DataSurface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Menu with flat items (no submenus) for basic ID testing.
 */
function MenuWithFlatItems({ getItemId }: { getItemId?: GetItemIdFn }) {
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
            <DropdownMenu.DataSurface
              data-testid="surface"
              content={content}
              deepSearch={{ enabled: true }}
              getItemId={getItemId}
            >
              <DropdownMenu.DataList>
                {({ nodes, renderNode }) => nodes.map(renderNode)}
              </DropdownMenu.DataList>
            </DropdownMenu.DataSurface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Menu for testing custom getItemId function.
 */
function MenuWithCustomGetItemId({
  getItemId,
  getItemIdSpy,
}: {
  getItemId: GetItemIdFn
  getItemIdSpy?: (ctx: GetItemIdContext) => void
}) {
  const wrappedGetItemId: GetItemIdFn = React.useCallback(
    (ctx) => {
      getItemIdSpy?.(ctx)
      return getItemId(ctx)
    },
    [getItemId, getItemIdSpy],
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
            <DropdownMenu.DataSurface
              data-testid="surface"
              content={content}
              deepSearch={{ enabled: true, minLength: 0 }}
              getItemId={wrappedGetItemId}
            >
              <DropdownMenu.DataInput
                data-testid="search-input"
                placeholder="Search..."
              />
              <DropdownMenu.DataList>
                {({ nodes, renderNode }) => nodes.map(renderNode)}
              </DropdownMenu.DataList>
            </DropdownMenu.DataSurface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

// ============================================================================
// Tests
// ============================================================================

describe('DataList getItemId', () => {
  describe('DOM ID verification', () => {
    it('renders items with their node.value as DOM id at root level', async () => {
      render(<MenuWithFlatItems />)

      // Wait for items to be visible (menu is defaultOpen)
      await waitFor(() => {
        expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      })

      // Items at root level should have their value as ID
      const apple = screen.getByTestId('item-apple')
      const banana = screen.getByTestId('item-banana')
      const cherry = screen.getByTestId('item-cherry')

      expect(apple).toHaveAttribute('id', 'Apple')
      expect(banana).toHaveAttribute('id', 'Banana')
      expect(cherry).toHaveAttribute('id', 'Cherry')
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

      // Find items by their composite IDs (now using value instead of id)
      const statusBacklog = document.getElementById('Status.Backlog')
      const projectStatusBacklog = document.getElementById(
        'Project Status.Backlog',
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
      const statusBacklog = document.getElementById('Status.Backlog')
      const projectStatusBacklog = document.getElementById(
        'Project Status.Backlog',
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
        const statusBacklog = document.getElementById('Status.Backlog')
        expect(statusBacklog).toHaveAttribute('data-highlighted', '')
      })

      // Navigate down - should highlight second item (Project Status.Backlog)
      await user.keyboard('{ArrowDown}')

      await waitFor(() => {
        const projectStatusBacklog = document.getElementById(
          'Project Status.Backlog',
        )
        expect(projectStatusBacklog).toHaveAttribute('data-highlighted', '')
      })

      const statusBacklog = document.getElementById('Status.Backlog')
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

      // Click the first backlog (Status.Backlog)
      const statusBacklog = document.getElementById('Status.Backlog')
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
        expect(input).toHaveAttribute('aria-activedescendant', 'Status.Backlog')
      })

      // Navigate down to second item
      await user.keyboard('{ArrowDown}')

      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          'Project Status.Backlog',
        )
      })
    })
  })

  describe('custom getItemId function', () => {
    it('uses custom function for ID generation', async () => {
      const user = userEvent.setup()

      // Custom function that uses "/" as separator
      const customGetItemId: GetItemIdFn = (ctx) => {
        if (ctx.breadcrumbs.length > 0) {
          return [...ctx.breadcrumbs, ctx.value].join('/')
        }
        return ctx.value
      }

      render(<MenuWithCustomGetItemId getItemId={customGetItemId} />)

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
      const getItemIdSpy = vi.fn()

      const customGetItemId: GetItemIdFn = (ctx) => {
        if (ctx.breadcrumbs.length > 0) {
          return [...ctx.breadcrumbs, ctx.value].join('.')
        }
        return ctx.value
      }

      render(
        <MenuWithCustomGetItemId
          getItemId={customGetItemId}
          getItemIdSpy={getItemIdSpy}
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
      const themeCall = getItemIdSpy.mock.calls.find(
        (call) =>
          call[0].value === 'Theme' &&
          call[0].search?.query?.toLowerCase().includes('theme'),
      )

      expect(themeCall).toBeDefined()
      const ctx = themeCall![0] as GetItemIdContext

      // Verify context fields
      expect(ctx.value).toBe('Theme')
      expect(ctx.breadcrumbs).toEqual(['Settings'])
      expect(ctx.isDeepSearchResult).toBe(true)
      // The query should contain 'theme' at some point
      expect(ctx.search?.query.toLowerCase()).toContain('theme')
    })

    it('custom function can include index for uniqueness', async () => {
      const user = userEvent.setup()

      // Custom function that uses index prefix
      const customGetItemId: GetItemIdFn = (ctx) => {
        return `item-${ctx.index}-${ctx.value}`
      }

      render(<MenuWithCustomGetItemId getItemId={customGetItemId} />)

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
                  <DropdownMenu.DataSurface
                    content={contentWithSpecialChars}
                    deepSearch={{ enabled: true, minLength: 0 }}
                  >
                    <DropdownMenu.DataInput
                      data-testid="search-input"
                      placeholder="Search..."
                    />
                    <DropdownMenu.DataList>
                      {({ nodes, renderNode }) => nodes.map(renderNode)}
                    </DropdownMenu.DataList>
                  </DropdownMenu.DataSurface>
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

      // Verify composite IDs work with values (now using value instead of id)
      const underscoreItem = document.getElementById(
        'My Submenu.Item With Underscore',
      )
      const dashItem = document.getElementById('My Submenu.Item With Dashes')

      expect(underscoreItem).toBeInTheDocument()
      expect(dashItem).toBeInTheDocument()
    })
  })
})
