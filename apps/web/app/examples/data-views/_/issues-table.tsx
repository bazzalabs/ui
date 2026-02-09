'use client'

import {
  type Column,
  type DataViewState,
  type FiltersState,
  type SortRule,
  useDataView,
} from '@bazza-ui/data-view/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { format } from 'date-fns'
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  BookmarkIcon,
  CheckIcon,
  CopyIcon,
  EllipsisIcon,
  FilterIcon,
  FlameIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { cn } from '@/lib/utils'
import { FilterActions } from '@/registry/ui/data-view/components/actions/filter-actions'
import { FilterItem } from '@/registry/ui/data-view/components/item/filter-item'
import { FilterOperator } from '@/registry/ui/data-view/components/item/filter-operator'
import { FilterRemove } from '@/registry/ui/data-view/components/item/filter-remove'
import { FilterSubject } from '@/registry/ui/data-view/components/item/filter-subject'
import { FilterValue } from '@/registry/ui/data-view/components/item/filter-value'
import { FilterList } from '@/registry/ui/data-view/components/list/filter-list'
import { FilterMenu } from '@/registry/ui/data-view/components/menu/filter-menu'
import { DataViewProvider } from '@/registry/ui/data-view/components/provider/data-view-provider'
import { columnsConfig } from './columns'
import { ISSUES } from './data'
// Ensure module augmentation for DataViewStateMeta is loaded
import type { Issue } from './types'
import { DEFAULT_VIEW, PRESET_VIEWS } from './views'

// ── Helpers ────────────────────────────────────────────────

function findActiveView(
  views: DataViewState[],
  baseView: { filters: FiltersState; sort: SortRule[]; id?: string },
): DataViewState | undefined {
  // Match by id first, then by state deep-equal
  return (
    views.find((v) => v.id === baseView.id) ??
    views.find(
      (v) =>
        JSON.stringify(v.filters) === JSON.stringify(baseView.filters) &&
        JSON.stringify(v.sort) === JSON.stringify(baseView.sort),
    )
  )
}

// ── ViewSwitcher ───────────────────────────────────────────

function ViewSwitcher({
  views,
  activeView,
  hasOverrides,
  onLoadView,
  onSaveView,
}: {
  views: DataViewState[]
  activeView: DataViewState | undefined
  hasOverrides: boolean
  onLoadView: (view: DataViewState) => void
  onSaveView: () => void
}) {
  const presets = views.filter((v) => v.meta?.isPreset)
  const custom = views.filter((v) => !v.meta?.isPreset)

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
        {presets.map((view) => {
          const isActive = activeView?.id === view.id
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onLoadView(view)}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {view.name}
            </button>
          )
        })}
      </div>

      {custom.length > 0 && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <div className="flex items-center gap-0.5">
            {custom.map((view) => {
              const isActive = activeView?.id === view.id
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => onLoadView(view)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors',
                    isActive
                      ? 'bg-background text-foreground shadow-sm font-medium'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <BookmarkIcon className="size-3" />
                  {view.name}
                </button>
              )
            })}
          </div>
        </>
      )}

      {hasOverrides && (
        <span className="text-xs text-muted-foreground italic ml-1">
          (filtered)
        </span>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 ml-1"
            onClick={onSaveView}
          >
            <SaveIcon className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save current view</TooltipContent>
      </Tooltip>
    </div>
  )
}

// ── ViewHeader (Linear-style) ──────────────────────────────

function ViewHeader({
  activeView,
  hasOverrides,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  activeView: DataViewState | undefined
  hasOverrides: boolean
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  if (!activeView) return null

  return (
    <div className="flex items-center gap-2">
      <h2 className="text-lg font-semibold tracking-tight">
        {activeView.name}
      </h2>
      {hasOverrides && (
        <span className="text-xs text-muted-foreground italic">(modified)</span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <EllipsisIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[160px]">
          <DropdownMenuItem
            onClick={onEdit}
            disabled={activeView.meta?.isPreset}
          >
            <PencilIcon className="size-4" />
            Edit view
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <CopyIcon className="size-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={onDelete}
            disabled={activeView.meta?.isPreset}
          >
            <Trash2Icon className="size-4" />
            Delete view
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {activeView.meta?.description && !hasOverrides && (
        <>
          <Separator orientation="vertical" className="h-4 mx-1" />
          <span className="text-sm text-muted-foreground truncate max-w-[400px]">
            {activeView.meta.description}
          </span>
        </>
      )}
    </div>
  )
}

// ── ViewEditor (Linear-style inline edit panel) ────────────

function ViewEditor({
  view,
  columns,
  onSave,
  onCancel,
}: {
  view: DataViewState
  columns: Column<Issue>[]
  onSave: (update: {
    name: string
    description: string
    filters: FiltersState
    sort: DataViewState['sort']
  }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(view.name ?? '')
  const [description, setDescription] = useState(view.meta?.description ?? '')
  const [editFilters, setEditFilters] = useState<FiltersState>([
    ...view.filters,
  ])
  const [editSort, setEditSort] = useState<DataViewState['sort']>([
    ...view.sort,
  ])
  const [filterPickerOpen, setFilterPickerOpen] = useState(false)
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null)

  const filterableColumns = columns.filter(
    (c) =>
      c.type === 'option' || c.type === 'multiOption' || c.type === 'boolean',
  )

  const selectedColumn = selectedColumnId
    ? columns.find((c) => c.id === selectedColumnId)
    : null

  function handleAddFilterValue(column: Column<Issue>, value: string) {
    if (column.type === 'boolean') {
      setEditFilters((prev) => {
        const without = prev.filter((f) => f.columnId !== column.id)
        return [
          ...without,
          {
            columnId: column.id,
            type: column.type,
            operator: 'is',
            values: [value === 'true'],
          },
        ]
      })
      setSelectedColumnId(null)
      setFilterPickerOpen(false)
      return
    }

    setEditFilters((prev) => {
      const existing = prev.find((f) => f.columnId === column.id)
      if (existing) {
        if (existing.values.includes(value)) {
          // Remove value
          const newValues = existing.values.filter((v) => v !== value)
          if (newValues.length === 0) {
            return prev.filter((f) => f.columnId !== column.id)
          }
          return prev.map((f) =>
            f.columnId === column.id ? { ...f, values: newValues } : f,
          )
        }
        // Add value
        return prev.map((f) =>
          f.columnId === column.id ? { ...f, values: [...f.values, value] } : f,
        )
      }
      // New filter
      return [
        ...prev,
        {
          columnId: column.id,
          type: column.type,
          operator: column.type === 'multiOption' ? 'include' : 'is any of',
          values: [value],
        },
      ]
    })
  }

  function handleRemoveEditFilter(columnId: string) {
    setEditFilters((prev) => prev.filter((f) => f.columnId !== columnId))
  }

  function handleRemoveEditSort(index: number) {
    setEditSort((prev) => prev.filter((_, i) => i !== index))
  }

  const isDirty =
    name !== (view.name ?? '') ||
    description !== (view.meta?.description ?? '') ||
    JSON.stringify(editFilters) !== JSON.stringify(view.filters) ||
    JSON.stringify(editSort) !== JSON.stringify(view.sort)

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      {/* Name + actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="View name"
            className="text-lg font-semibold h-10 bg-background"
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            className="text-sm text-muted-foreground h-8 bg-background"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() =>
              onSave({
                name: name.trim() || 'Untitled View',
                description: description.trim(),
                filters: editFilters,
                sort: editSort,
              })
            }
            disabled={!isDirty && name.trim() === (view.name ?? '')}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Editable filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {editFilters.map((filter) => {
          const col = columns.find((c) => c.id === filter.columnId)
          if (!col) return null
          const Icon = col.icon as
            | React.ComponentType<{ className?: string }>
            | undefined

          return (
            <Badge
              key={filter.columnId}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {Icon && <Icon className="size-3" />}
              <span className="font-medium">{col.displayName}</span>
              <span className="text-muted-foreground">{filter.operator}</span>
              <button
                type="button"
                onClick={() => handleRemoveEditFilter(filter.columnId)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          )
        })}

        {editSort.map((rule, i) => {
          if (rule.type !== 'column') return null
          const col = columns.find((c) => c.id === rule.columnId)
          if (!col) return null
          return (
            <Badge
              key={`sort-${rule.columnId}`}
              variant="outline"
              className="gap-1 pr-1"
            >
              {rule.direction === 'asc' ? (
                <ArrowUpIcon className="size-3" />
              ) : (
                <ArrowDownIcon className="size-3" />
              )}
              <span className="font-medium">{col.displayName}</span>
              <button
                type="button"
                onClick={() => handleRemoveEditSort(i)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          )
        })}

        {/* Add filter picker */}
        <Popover open={filterPickerOpen} onOpenChange={setFilterPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs">
              <PlusIcon className="size-3" />
              Add filter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0" align="start">
            {!selectedColumn ? (
              <Command>
                <CommandInput placeholder="Filter by..." />
                <CommandList>
                  <CommandEmpty>No columns found.</CommandEmpty>
                  <CommandGroup>
                    {filterableColumns.map((col) => {
                      const Icon = col.icon as React.ComponentType<{
                        className?: string
                      }>
                      return (
                        <CommandItem
                          key={col.id}
                          onSelect={() => setSelectedColumnId(col.id)}
                        >
                          {Icon && (
                            <Icon className="size-4 text-muted-foreground" />
                          )}
                          {col.displayName}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            ) : (
              <Command>
                <CommandInput
                  placeholder={`Search ${selectedColumn.displayName}...`}
                />
                <CommandList>
                  <CommandEmpty>No options found.</CommandEmpty>
                  <CommandGroup>
                    {selectedColumn.type === 'boolean' ? (
                      <>
                        {[
                          { label: 'Yes', value: 'true' },
                          { label: 'No', value: 'false' },
                        ].map((opt) => {
                          const existingFilter = editFilters.find(
                            (f) => f.columnId === selectedColumn.id,
                          )
                          const isSelected =
                            existingFilter?.values[0] === (opt.value === 'true')
                          return (
                            <CommandItem
                              key={opt.value}
                              onSelect={() =>
                                handleAddFilterValue(selectedColumn, opt.value)
                              }
                            >
                              <div
                                className={cn(
                                  'flex size-4 items-center justify-center rounded-sm border border-primary',
                                  isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'opacity-50',
                                )}
                              >
                                {isSelected && <CheckIcon className="size-3" />}
                              </div>
                              {opt.label}
                            </CommandItem>
                          )
                        })}
                      </>
                    ) : (
                      selectedColumn.getOptions().map((opt) => {
                        const existingFilter = editFilters.find(
                          (f) => f.columnId === selectedColumn.id,
                        )
                        const isSelected =
                          existingFilter?.values.includes(opt.value) ?? false
                        const Icon = opt.icon as
                          | React.ComponentType<{ className?: string }>
                          | undefined

                        return (
                          <CommandItem
                            key={opt.value}
                            onSelect={() =>
                              handleAddFilterValue(selectedColumn, opt.value)
                            }
                          >
                            <div
                              className={cn(
                                'flex size-4 items-center justify-center rounded-sm border border-primary',
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'opacity-50',
                              )}
                            >
                              {isSelected && <CheckIcon className="size-3" />}
                            </div>
                            {Icon && (
                              <Icon className="size-4 text-muted-foreground" />
                            )}
                            {opt.label}
                          </CommandItem>
                        )
                      })
                    )}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => setSelectedColumnId(null)}
                      className="justify-center text-muted-foreground"
                    >
                      Back to columns
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

// ── VirtualizedTable ───────────────────────────────────────

const ROW_HEIGHT = 41 // px — matches the default table row height

function VirtualizedTable({
  data,
  columns,
  parentRef,
}: {
  data: Issue[]
  columns: Column<Issue>[]
  parentRef: React.RefObject<HTMLDivElement | null>
}) {
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  })

  return (
    <div
      ref={parentRef}
      className="rounded-md border overflow-auto"
      style={{ maxHeight: 'calc(100vh - 380px)', minHeight: '400px' }}
    >
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead className="min-w-[250px]">
              <SortableHeader column={columns.find((c) => c.id === 'title')!} />
            </TableHead>
            <TableHead className="w-[140px]">
              <SortableHeader
                column={columns.find((c) => c.id === 'status')!}
              />
            </TableHead>
            <TableHead className="w-[200px]">Labels</TableHead>
            <TableHead className="w-[100px]">
              <SortableHeader
                column={columns.find((c) => c.id === 'estimatedHours')!}
              />
            </TableHead>
            <TableHead className="w-[130px]">
              <SortableHeader
                column={columns.find((c) => c.id === 'startDate')!}
              />
            </TableHead>
            <TableHead className="w-[80px]">Urgent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <FilterIcon className="size-5" />
                  <span>No issues match your filters.</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            <>
              {/* Top spacer */}
              {(virtualizer.getVirtualItems()[0]?.start ?? 0) > 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      height: virtualizer.getVirtualItems()[0]?.start,
                    }}
                  />
                </tr>
              )}
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const issue = data[virtualRow.index]!
                const StatusIcon = issue.status.icon
                const labels = issue.labels
                return (
                  <TableRow
                    key={issue.id}
                    data-index={virtualRow.index}
                    style={{ height: `${virtualRow.size}px` }}
                  >
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {issue.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium">{issue.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className="size-4 text-muted-foreground" />
                        <span className="text-sm">{issue.status.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {labels && labels.length > 0 ? (
                          labels.map((label) => (
                            <Badge
                              key={label.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {label.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            --
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {issue.estimatedHours}h
                    </TableCell>
                    <TableCell className="text-sm">
                      {issue.startDate ? (
                        format(issue.startDate, 'MMM d, yyyy')
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {issue.isUrgent && (
                        <FlameIcon className="size-4 text-orange-500" />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {/* Bottom spacer */}
              {virtualizer.getVirtualItems().length > 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      height:
                        virtualizer.getTotalSize() -
                        (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                    }}
                  />
                </tr>
              )}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// ── SortableHeader ─────────────────────────────────────────

function SortableHeader({ column }: { column: Column<Issue> }) {
  const sortDir = column.getIsSorted()

  if (!column.sortable) {
    return <span>{column.displayName}</span>
  }

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting()}
      className="flex items-center gap-1 hover:text-foreground transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-muted/50"
    >
      {column.displayName}
      {sortDir === 'asc' ? (
        <ArrowUpIcon className="size-3.5" />
      ) : sortDir === 'desc' ? (
        <ArrowDownIcon className="size-3.5" />
      ) : (
        <ArrowUpDownIcon className="size-3.5 opacity-30" />
      )}
    </button>
  )
}

// ── Main Component ─────────────────────────────────────────

export function IssuesTable() {
  const [views, setViews] = useState<DataViewState[]>(PRESET_VIEWS)
  const [editingViewId, setEditingViewId] = useState<string | null>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const dataView = useDataView({
    strategy: 'client',
    data: ISSUES,
    columnsConfig,
    defaultBaseView: DEFAULT_VIEW,
    entityName: 'issues',
  })

  const { columns, baseView, overrides, sort, processedData, snapshot } =
    dataView

  const hasOverrides = overrides.filters.length > 0 || overrides.sort.length > 0

  const activeView = useMemo(
    () => findActiveView(views, baseView),
    [views, baseView],
  )

  const editingView = editingViewId
    ? views.find((v) => v.id === editingViewId)
    : null

  // ── View CRUD ──────────────────────────────────────────

  const handleLoadView = useCallback(
    (view: DataViewState) => {
      setEditingViewId(null)
      baseView.load(view)
    },
    [baseView],
  )

  const handleSaveNewView = useCallback(() => {
    const id = `custom-${Date.now()}`
    const snap = snapshot({
      id,
      name: `Saved View ${views.filter((v) => !v.meta?.isPreset).length + 1}`,
    })
    const newView: DataViewState = {
      id,
      name: snap.name ?? 'Untitled View',
      filters: snap.filters,
      sort: snap.sort,
      meta: { description: '', isPreset: false },
    }
    setViews((prev) => [...prev, newView])
    baseView.load(newView)
    setEditingViewId(id)
  }, [views, snapshot, baseView])

  const handleEditView = useCallback(() => {
    if (activeView && !activeView.meta?.isPreset) {
      setEditingViewId(activeView.id ?? null)
    }
  }, [activeView])

  const handleSaveEdit = useCallback(
    (update: {
      name: string
      description: string
      filters: FiltersState
      sort: DataViewState['sort']
    }) => {
      if (!editingViewId) return

      setViews((prev) =>
        prev.map((v) =>
          v.id === editingViewId
            ? {
                ...v,
                name: update.name,
                filters: update.filters,
                sort: update.sort,
                meta: {
                  ...v.meta,
                  description: update.description || undefined,
                },
              }
            : v,
        ),
      )

      // Also update the live base view to reflect edits
      baseView.load({
        id: editingViewId,
        name: update.name,
        filters: update.filters,
        sort: update.sort,
      })

      setEditingViewId(null)
    },
    [editingViewId, baseView],
  )

  const handleCancelEdit = useCallback(() => {
    setEditingViewId(null)
  }, [])

  const handleDuplicateView = useCallback(() => {
    if (!activeView) return

    const id = `custom-${Date.now()}`
    const duplicate: DataViewState = {
      id,
      name: `Copy of ${activeView.name}`,
      filters: [...activeView.filters],
      sort: [...activeView.sort],
      meta: {
        description: activeView.meta?.description,
        isPreset: false,
      },
    }
    setViews((prev) => [...prev, duplicate])
    baseView.load(duplicate)
    setEditingViewId(id)
  }, [activeView, baseView])

  const handleDeleteView = useCallback(() => {
    if (!activeView || activeView.meta?.isPreset) return

    setViews((prev) => prev.filter((v) => v.id !== activeView.id))
    setEditingViewId(null)

    // Fall back to the first preset view
    const fallback = PRESET_VIEWS[0]!
    baseView.load(fallback)
  }, [activeView, baseView])

  // ── Render ──────────────────────────────────────────────

  return (
    <TooltipProvider>
      <DataViewProvider instance={dataView} layer="overrides">
        <div className="space-y-4">
          {/* View Switcher (tab bar) */}
          <ViewSwitcher
            views={views}
            activeView={activeView}
            hasOverrides={hasOverrides}
            onLoadView={handleLoadView}
            onSaveView={handleSaveNewView}
          />

          {/* View Header (name + ... menu) */}
          <ViewHeader
            activeView={activeView}
            hasOverrides={hasOverrides}
            onEdit={handleEditView}
            onDuplicate={handleDuplicateView}
            onDelete={handleDeleteView}
          />

          {/* Inline View Editor (Linear-style) */}
          {editingView && (
            <ViewEditor
              view={editingView}
              columns={columns}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          )}

          {/* Override Toolbar — FilterMenu + FilterList + FilterActions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <FilterMenu />
              <FilterList>
                {({ filter, column }) => (
                  <FilterItem filter={filter} column={column}>
                    <FilterSubject />
                    <FilterOperator />
                    <FilterValue />
                    <FilterRemove />
                  </FilterItem>
                )}
              </FilterList>
              <FilterActions />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {processedData.length} of {ISSUES.length} issues
              </span>
              {sort.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-muted-foreground"
                  onClick={() => overrides.clearSort()}
                >
                  Clear sort
                </Button>
              )}
            </div>
          </div>

          {/* Virtualized Table */}
          <VirtualizedTable
            data={processedData}
            columns={columns}
            parentRef={tableContainerRef}
          />

          {/* Debug info */}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              View state (debug)
            </summary>
            <pre className="mt-2 rounded-md bg-muted p-4 overflow-auto max-h-[300px]">
              {JSON.stringify(
                {
                  activeView: activeView
                    ? {
                        id: activeView.id,
                        name: activeView.name,
                        description: activeView.meta?.description,
                        isPreset: activeView.meta?.isPreset,
                      }
                    : null,
                  baseView: {
                    id: baseView.id,
                    name: baseView.name,
                    filters: baseView.filters,
                    sort: baseView.sort,
                  },
                  overrides: {
                    filters: overrides.filters,
                    sort: overrides.sort,
                  },
                  effective: dataView.view,
                  savedViews: views
                    .filter((v) => !v.meta?.isPreset)
                    .map((v) => ({ id: v.id, name: v.name })),
                },
                null,
                2,
              )}
            </pre>
          </details>
        </div>
      </DataViewProvider>
    </TooltipProvider>
  )
}
