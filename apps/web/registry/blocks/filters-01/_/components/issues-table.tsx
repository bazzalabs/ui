'use client'

import type { FiltersState } from '@bazza-ui/filters'
import { useDataTableFilters } from '@bazza-ui/filters'
import {
  createTSTColumns,
  createTSTFilters,
} from '@bazza-ui/filters/tanstack-table'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { Filter } from '@/registry/components/filter'
import { tstColumnDefs } from '../lib/columns'
import { ISSUES } from '../lib/data'
import { columnsConfig } from '../lib/filters'
import { DataTable } from './data-table'

export function IssuesTable() {
  const { columns, filters, actions, strategy, entityName } =
    useDataTableFilters({
      strategy: 'client',
      data: ISSUES,
      entityName: 'Issue',
      columnsConfig,
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
        <Filter.Root
          variant="clean"
          filters={filters}
          columns={columns}
          actions={actions}
          strategy={strategy}
          entityName={entityName}
        >
          <div className="flex md:flex-wrap gap-2 w-full flex-1">
            <Filter.Menu />
            <Filter.List>
              {({ filter, column }) => (
                <Filter.Block filter={filter} column={column}>
                  <Filter.Subject column={column} />
                  <Filter.Operator
                    filter={filter}
                    column={column}
                    actions={actions}
                    locale="en"
                  />
                  <Filter.Value
                    filter={filter}
                    column={column}
                    actions={actions}
                    strategy={strategy}
                  />
                  <Filter.Remove filter={filter} actions={actions} />
                </Filter.Block>
              )}
            </Filter.List>
          </div>
          <Filter.Actions />
        </Filter.Root>
      </div>
      <DataTable table={table} />
    </div>
  )
}
