'use client'

import {
  type Column,
  type DataViewState,
  type FiltersState,
  type SortRule,
  useDataView,
} from '@bazza-ui/data-view/react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  EllipsisIcon,
  FilterIcon,
  FlameIcon,
  Loader2Icon,
  PencilIcon,
  SaveIcon,
  ServerIcon,
  Trash2Icon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

import { fetchIssues, fetchLabels, fetchStatuses, fetchUsers } from './actions'
import { columnsConfig } from './columns'
import { STATUS_ICON_MAP } from './data'
import type { Issue } from './types'
import { DEFAULT_VIEW, PRESET_VIEWS } from './views'

// ── Helpers ────────────────────────────────────────────────

function findActiveView(
  views: DataViewState[],
  baseView: { filters: FiltersState; sort: SortRule[]; id?: string },
): DataViewState | undefined {
  return (
    views.find((v) => v.id === baseView.id) ??
    views.find(
      (v) =>
        JSON.stringify(v.filters) === JSON.stringify(baseView.filters) &&
        JSON.stringify(v.sort) === JSON.stringify(baseView.sort),
    )
  )
}

const PAGE_SIZE = 25

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

// ── ViewHeader ─────────────────────────────────────────────

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

// ── Pagination ─────────────────────────────────────────────

function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  isLoading,
}: {
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  isLoading: boolean
}) {
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        {totalCount > 0 ? (
          <>
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, totalCount)} of {totalCount} issues
          </>
        ) : (
          'No issues found'
        )}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
        >
          <ChevronLeftIcon className="size-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground px-2">
          Page {page} of {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
        >
          Next
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
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

// ── Table ──────────────────────────────────────────────────

function IssuesTableBody({
  data,
  columns,
  isLoading,
}: {
  data: Issue[]
  columns: Column<Issue>[]
  isLoading: boolean
}) {
  return (
    <div className="rounded-md border overflow-auto max-h-[calc(100vh-380px)] min-h-[400px]">
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
            <TableHead className="w-[140px]">Assignee</TableHead>
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
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Loader2Icon className="size-5 animate-spin" />
                  <span>Loading issues...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <FilterIcon className="size-5" />
                  <span>No issues match your filters.</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((issue) => {
              const StatusIcon = STATUS_ICON_MAP[issue.status.id]
              return (
                <TableRow key={issue.id}>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {issue.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="font-medium">{issue.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {StatusIcon && (
                        <StatusIcon className="size-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">{issue.status.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {issue.assignee ? (
                      <span className="text-sm">{issue.assignee.name}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {issue.labels.length > 0 ? (
                        issue.labels.map((label) => (
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
                      format(new Date(issue.startDate), 'MMM d, yyyy')
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
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────

export function IssuesTable() {
  const [views, setViews] = useState<DataViewState[]>(PRESET_VIEWS)
  const [_, setEditingViewId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // ── Fetch options for option-based columns via React Query ──
  const { data: statuses } = useQuery({
    queryKey: ['data-view-options', 'statuses'],
    queryFn: () => fetchStatuses(),
    staleTime: 10 * 60 * 1000, // 10 min — statuses rarely change
  })

  const { data: users } = useQuery({
    queryKey: ['data-view-options', 'users'],
    queryFn: () => fetchUsers(),
    staleTime: 5 * 60 * 1000, // 5 min
  })

  const { data: labels } = useQuery({
    queryKey: ['data-view-options', 'labels'],
    queryFn: () => fetchLabels(),
    staleTime: 2 * 60 * 1000, // 2 min
  })

  const statusOptions = useMemo(
    () => statuses?.map((s) => ({ label: s.name, value: s.id })),
    [statuses],
  )

  const userOptions = useMemo(
    () => users?.map((u) => ({ label: u.name, value: u.id })),
    [users],
  )

  const labelOptions = useMemo(
    () => labels?.map((l) => ({ label: l.name, value: l.id })),
    [labels],
  )

  const dataView = useDataView({
    strategy: 'server',
    data: [] as Issue[],
    columnsConfig,
    defaultBaseView: DEFAULT_VIEW,
    entityName: 'issues',
    options: {
      status: statusOptions,
      assignee: userOptions,
      labels: labelOptions,
    },
  })

  const { columns, baseView, overrides, sort, view, snapshot } = dataView
  const hasOverrides = overrides.filters.length > 0 || overrides.sort.length > 0

  const activeView = useMemo(
    () => findActiveView(views, baseView),
    [views, baseView],
  )

  // Reset page when filters/sort change
  const viewKey = JSON.stringify({ filters: view.filters, sort: view.sort })
  useEffect(() => {
    setPage(1)
  }, [viewKey])

  // ── Server data fetching via React Query ──
  const { data: queryResult, isLoading } = useQuery({
    queryKey: ['issues', view.filters, view.sort, page, PAGE_SIZE],
    queryFn: () =>
      fetchIssues({
        view: { filters: view.filters, sort: view.sort },
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev, // keep previous data while loading
  })

  const issues = queryResult?.data ?? []
  const totalCount = queryResult?.totalCount ?? 0

  // ── View CRUD ──

  const handleLoadView = useCallback(
    (v: DataViewState) => {
      setEditingViewId(null)
      baseView.load(v)
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

  const handleDuplicateView = useCallback(() => {
    if (!activeView) return
    const id = `custom-${Date.now()}`
    const duplicate: DataViewState = {
      id,
      name: `Copy of ${activeView.name}`,
      filters: [...activeView.filters],
      sort: [...activeView.sort],
      meta: { description: activeView.meta?.description, isPreset: false },
    }
    setViews((prev) => [...prev, duplicate])
    baseView.load(duplicate)
    setEditingViewId(id)
  }, [activeView, baseView])

  const handleDeleteView = useCallback(() => {
    if (!activeView || activeView.meta?.isPreset) return
    setViews((prev) => prev.filter((v) => v.id !== activeView.id))
    setEditingViewId(null)
    baseView.load(PRESET_VIEWS[0]!)
  }, [activeView, baseView])

  // ── Render ──

  return (
    <TooltipProvider>
      <DataViewProvider instance={dataView} layer="overrides">
        <div className="space-y-4">
          {/* View Switcher */}
          <ViewSwitcher
            views={views}
            activeView={activeView}
            hasOverrides={hasOverrides}
            onLoadView={handleLoadView}
            onSaveView={handleSaveNewView}
          />

          {/* View Header */}
          <ViewHeader
            activeView={activeView}
            hasOverrides={hasOverrides}
            onEdit={handleEditView}
            onDuplicate={handleDuplicateView}
            onDelete={handleDeleteView}
          />

          {/* Toolbar */}
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
              {isLoading && (
                <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
              )}
              <Badge variant="secondary" className="gap-1">
                <ServerIcon className="size-3" />
                Server-side
              </Badge>
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

          {/* Table */}
          <IssuesTableBody
            data={issues}
            columns={columns}
            isLoading={isLoading}
          />

          {/* Pagination */}
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={totalCount}
            onPageChange={setPage}
            isLoading={isLoading}
          />

          {/* Debug info */}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              View state (debug)
            </summary>
            <pre className="mt-2 rounded-md bg-muted p-4 overflow-auto max-h-[300px]">
              {JSON.stringify(
                {
                  strategy: 'server',
                  page,
                  pageSize: PAGE_SIZE,
                  totalCount,
                  resultCount: issues.length,
                  activeView: activeView
                    ? {
                        id: activeView.id,
                        name: activeView.name,
                        description: activeView.meta?.description,
                      }
                    : null,
                  view: { filters: view.filters, sort: view.sort },
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
