'use client'

import type { FiltersState } from '@bazzaui/filters'
import { createTypedDataTableFilters } from '@bazzaui/filters'
import {
  createTSTColumns,
  createTSTFilters,
} from '@bazzaui/filters/tanstack-table'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { DataTableFilter } from '@/registry/data-table-filter'
import { tstColumnDefs } from './columns'
import { ISSUES } from './data'
import { DataTable } from './data-table'
import { columnsConfig } from './filters'

type IssuesFilteringContext = {
  foo?: string
}

const useIssuesTableFilters =
  createTypedDataTableFilters<IssuesFilteringContext>()

export function IssuesTable({
  state,
}: {
  state: {
    filters: FiltersState
    setFilters: React.Dispatch<React.SetStateAction<FiltersState>>
  }
}) {
  function handleFiltersChange(
    _prev: FiltersState,
    next: FiltersState,
    _context?: IssuesFilteringContext,
  ) {
    state.setFilters(next)
  }

  const { columns, filters, actions, strategy, entityName } =
    useIssuesTableFilters({
      strategy: 'client',
      data: ISSUES,
      entityName: 'Issue',
      columnsConfig,
      filters: state.filters,
      onFiltersChange: handleFiltersChange,
    })

  // Step 4: Extend our TanStack Table columns with custom filter functions (and more!)
  //         using our integration hook.
  const tstColumns = useMemo(
    () =>
      createTSTColumns({
        columns: tstColumnDefs,
        configs: columns,
      }),
    [columns],
  )

  const tstFilters = useMemo(() => createTSTFilters(filters), [filters])

  // Step 5: Create our TanStack Table instance
  const [rowSelection, setRowSelection] = useState({})
  const table = useReactTable({
    data: ISSUES,
    columns: tstColumns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      columnFilters: tstFilters,
      columnVisibility: {
        isUrgent: false,
      },
    },
  })

  // Step 6: Render the table!
  return (
    <div className="w-full col-span-2">
      <div className="flex items-center pb-4 gap-2">
        <DataTableFilter
          filters={filters}
          columns={columns}
          actions={actions}
          strategy={strategy}
          entityName={entityName}
        />
      </div>
      <DataTable table={table} />
    </div>
  )
}
