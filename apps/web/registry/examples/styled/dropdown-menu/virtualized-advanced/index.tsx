'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

// =============================================================================
// Source Data (API-like structure)
// =============================================================================
//
// This represents how you might receive data from an API endpoint.
// Groups contain their items in a nested structure.

interface ActionItem {
  id: string
  label: string
  kind: 'action'
}

interface ToggleItem {
  id: string
  label: string
  kind: 'toggle'
  defaultEnabled?: boolean
}

interface OptionItem {
  id: string
  label: string
  kind: 'option'
}

type MenuItem = ActionItem | ToggleItem | OptionItem

interface MenuGroup {
  id: string
  label: string
  items: MenuItem[]
}

// Nested group structure - imagine this coming from an API
const menuGroups: MenuGroup[] = [
  {
    id: 'settings',
    label: 'Settings',
    items: [
      {
        id: 'autosave',
        label: 'Auto-save',
        kind: 'toggle',
        defaultEnabled: true,
      },
      {
        id: 'darkmode',
        label: 'Dark mode',
        kind: 'toggle',
        defaultEnabled: false,
      },
      {
        id: 'notifications',
        label: 'Notifications',
        kind: 'toggle',
        defaultEnabled: true,
      },
      {
        id: 'sounds',
        label: 'Sound effects',
        kind: 'toggle',
        defaultEnabled: false,
      },
      {
        id: 'animations',
        label: 'Animations',
        kind: 'toggle',
        defaultEnabled: true,
      },
      {
        id: 'compact',
        label: 'Compact view',
        kind: 'toggle',
        defaultEnabled: false,
      },
      {
        id: 'tooltips',
        label: 'Show tooltips',
        kind: 'toggle',
        defaultEnabled: true,
      },
      {
        id: 'shortcuts',
        label: 'Enable shortcuts',
        kind: 'toggle',
        defaultEnabled: false,
      },
    ],
  },
  {
    id: 'sort',
    label: 'Sort By',
    items: [
      { id: 'sort-name', label: 'Name', kind: 'option' },
      { id: 'sort-date', label: 'Date', kind: 'option' },
      { id: 'sort-size', label: 'Size', kind: 'option' },
      { id: 'sort-type', label: 'Type', kind: 'option' },
      { id: 'sort-modified', label: 'Modified', kind: 'option' },
    ],
  },
  {
    id: 'view',
    label: 'View',
    items: [
      { id: 'view-grid', label: 'Grid', kind: 'option' },
      { id: 'view-list', label: 'List', kind: 'option' },
      { id: 'view-compact', label: 'Compact', kind: 'option' },
      { id: 'view-details', label: 'Details', kind: 'option' },
    ],
  },
  {
    id: 'more-items',
    label: 'More Items',
    items: Array.from({ length: 300 }, (_, i) => ({
      id: `item-${i + 1}`,
      label: `Item ${i + 1}`,
      kind: 'action' as const,
    })),
  },
  {
    id: 'priority',
    label: 'Priority',
    items: [
      { id: 'priority-low', label: 'Low', kind: 'option' },
      { id: 'priority-medium', label: 'Medium', kind: 'option' },
      { id: 'priority-high', label: 'High', kind: 'option' },
      { id: 'priority-critical', label: 'Critical', kind: 'option' },
    ],
  },
  {
    id: 'actions',
    label: 'Actions',
    items: Array.from({ length: 200 }, (_, i) => ({
      id: `action-${i + 1}`,
      label: `Action ${i + 1}`,
      kind: 'action' as const,
    })),
  },
  {
    id: 'features',
    label: 'Feature Flags',
    items: Array.from({ length: 50 }, (_, i) => ({
      id: `feature-${i + 1}`,
      label: `Feature ${i + 1}`,
      kind: 'toggle' as const,
      defaultEnabled: false,
    })),
  },
]

// =============================================================================
// Flattened Rows for Virtualization
// =============================================================================
//
// The virtualizer needs a flat list. We expand the nested group structure
// into rows that include group labels and separators between groups.

type Row =
  | { type: 'group-label'; id: string; label: string }
  | { type: 'separator'; id: string }
  | { type: 'action'; id: string; label: string }
  | { type: 'toggle'; id: string; label: string }
  | { type: 'radio'; id: string; label: string; groupId: string }

function flattenGroups(groups: MenuGroup[]): Row[] {
  const rows: Row[] = []

  groups.forEach((group, index) => {
    // Add separator between groups (except before first)
    if (index > 0) {
      rows.push({ type: 'separator', id: `sep-${group.id}` })
    }

    // Add group label
    rows.push({
      type: 'group-label',
      id: `label-${group.id}`,
      label: group.label,
    })

    // Add items - map item kind to row type
    for (const item of group.items) {
      switch (item.kind) {
        case 'action':
          rows.push({ type: 'action', id: item.id, label: item.label })
          break
        case 'toggle':
          rows.push({ type: 'toggle', id: item.id, label: item.label })
          break
        case 'option':
          rows.push({
            type: 'radio',
            id: item.id,
            label: item.label,
            groupId: group.id,
          })
          break
      }
    }
  })

  return rows
}

// Pre-compute the flattened rows
const allRows = flattenGroups(menuGroups)

// =============================================================================
// Constants
// =============================================================================

// Estimated heights for initial render - actual heights will be measured dynamically
const ESTIMATED_ROW_HEIGHT = 32
const ESTIMATED_SEPARATOR_HEIGHT = 9

function getEstimatedRowHeight(row: Row): number {
  return row.type === 'separator'
    ? ESTIMATED_SEPARATOR_HEIGHT
    : ESTIMATED_ROW_HEIGHT
}

// Total item count for display
const totalItemCount = menuGroups.reduce(
  (sum, group) => sum + group.items.length,
  0,
)

// =============================================================================
// Component
// =============================================================================

export default function DropdownMenuVirtualizedAdvanced() {
  const [search, setSearch] = React.useState('')
  const [virtualizerEnabled, setVirtualizerEnabled] = React.useState(false)
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null)
  const previousSearchRef = React.useRef(search)

  // Initialize toggle state from items with defaultEnabled
  const [enabledToggles, setEnabledToggles] = React.useState<Set<string>>(
    () => {
      const enabled = new Set<string>()
      for (const group of menuGroups) {
        for (const item of group.items) {
          if (item.kind === 'toggle' && item.defaultEnabled) {
            enabled.add(item.id)
          }
        }
      }
      return enabled
    },
  )

  // Initialize radio state - first option in each group
  const [radioValues, setRadioValues] = React.useState<Record<string, string>>(
    () => {
      const values: Record<string, string> = {}
      for (const group of menuGroups) {
        const firstOption = group.items.find((item) => item.kind === 'option')
        if (firstOption) {
          values[group.id] = firstOption.id
        }
      }
      return values
    },
  )

  // Filter rows based on search query
  const filteredRows = React.useMemo(() => {
    if (!search) return allRows

    const query = search.toLowerCase()
    const result: Row[] = []
    let pendingGroupLabel: Row | null = null

    for (const row of allRows) {
      // Skip separators entirely when searching
      if (row.type === 'separator') {
        pendingGroupLabel = null
        continue
      }

      if (row.type === 'group-label') {
        pendingGroupLabel = row
        continue
      }

      // Check if row matches search
      if (row.label.toLowerCase().includes(query)) {
        // Add pending group label if we have one
        if (pendingGroupLabel) {
          result.push(pendingGroupLabel)
          pendingGroupLabel = null
        }
        result.push(row)
      }
    }

    return result
  }, [search])

  // Build items array for the dropdown menu (only selectable rows)
  const dropdownItems = React.useMemo(() => {
    return filteredRows
      .filter(
        (row): row is Extract<Row, { label: string }> =>
          row.type === 'action' ||
          row.type === 'toggle' ||
          row.type === 'radio',
      )
      .map((row) => ({ value: row.id, label: row.label }))
  }, [filteredRows])

  // Virtualizer
  const virtualizer = useVirtualizer({
    enabled: virtualizerEnabled,
    count: filteredRows.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: (index) => {
      const row = filteredRows[index]
      return row ? getEstimatedRowHeight(row) : ESTIMATED_ROW_HEIGHT
    },
    overscan: 5,
  })

  React.useLayoutEffect(() => {
    if (previousSearchRef.current === search) {
      return
    }

    previousSearchRef.current = search
    virtualizer.scrollToOffset(0)
  }, [search, virtualizer])

  const handleScrollElementRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      scrollElementRef.current = element
      if (element) virtualizer.measure()
    },
    [virtualizer],
  )

  // Sync virtualizer scroll with keyboard highlight
  const handleHighlightChange = React.useCallback(
    (_id: string | null, _node: unknown, index: number) => {
      if (index < 0) return

      // Map selectable item index to row index
      let selectableCount = 0
      for (let i = 0; i < filteredRows.length; i++) {
        const row = filteredRows[i]
        if (!row) continue
        if (
          row.type === 'action' ||
          row.type === 'toggle' ||
          row.type === 'radio'
        ) {
          if (selectableCount === index) {
            queueMicrotask(() =>
              virtualizer.scrollToIndex(i, { align: 'auto' }),
            )
            return
          }
          selectableCount++
        }
      }
    },
    [virtualizer, filteredRows],
  )

  // Enable virtualizer on open, disable on close
  const handleOpenChange = React.useCallback((open: boolean) => {
    if (open) setVirtualizerEnabled(true)
  }, [])

  const handleOpenChangeComplete = React.useCallback((open: boolean) => {
    if (!open) {
      setVirtualizerEnabled(false)
      setSearch('')
    }
  }, [])

  // Render a single row
  const renderRow = (row: Row) => {
    switch (row.type) {
      case 'group-label':
        return <DropdownMenu.GroupLabel>{row.label}</DropdownMenu.GroupLabel>

      case 'separator':
        return <DropdownMenu.Separator />

      case 'action':
        return (
          <DropdownMenu.Item
            id={row.id}
            value={row.id}
            onSelect={() => toast(`Selected: ${row.label}`)}
          >
            {row.label}
          </DropdownMenu.Item>
        )

      case 'toggle':
        return (
          <DropdownMenu.CheckboxItem
            id={row.id}
            checked={enabledToggles.has(row.id)}
            onCheckedChange={(checked) => {
              setEnabledToggles((prev) => {
                const next = new Set(prev)
                checked ? next.add(row.id) : next.delete(row.id)
                return next
              })
            }}
          >
            <DropdownMenu.CheckboxItemIndicator />
            {row.label}
          </DropdownMenu.CheckboxItem>
        )

      case 'radio':
        return (
          <DropdownMenu.RadioItem id={row.id} value={row.id}>
            {row.label}
            <DropdownMenu.RadioItemIndicator />
          </DropdownMenu.RadioItem>
        )
    }
  }

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <DropdownMenu.Root
      virtualized
      items={dropdownItems}
      onHighlightChange={handleHighlightChange}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Advanced Menu ({totalItemCount} items)
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup className="w-(--anchor-width)">
            <DropdownMenu.Surface filter={false}>
              <DropdownMenu.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Search menu..."
              />
              <DropdownMenu.List viewportRef={handleScrollElementRef}>
                <DropdownMenu.Empty />
                <div
                  style={{
                    height: virtualizer.getTotalSize(),
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualItems.map((virtualRow) => {
                    const row = filteredRows[virtualRow.index]
                    if (!row) return null

                    const style: React.CSSProperties = {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }

                    // Wrap radio items in RadioGroup for proper state management
                    if (row.type === 'radio') {
                      return (
                        <div
                          key={row.id}
                          data-index={virtualRow.index}
                          ref={virtualizer.measureElement}
                          style={style}
                        >
                          <DropdownMenu.RadioGroup
                            value={radioValues[row.groupId]}
                            onValueChange={(value) =>
                              setRadioValues((prev) => ({
                                ...prev,
                                [row.groupId]: value,
                              }))
                            }
                          >
                            {renderRow(row)}
                          </DropdownMenu.RadioGroup>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={row.id}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        style={style}
                      >
                        {renderRow(row)}
                      </div>
                    )
                  })}
                </div>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
