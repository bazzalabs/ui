'use client'

import { useListVirtualizer } from '@bazza-ui/react/layout/list/virtualizer'
import type * as React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { List } from '@/registry/ui/list'
import {
  formatAmount,
  formatDate,
  makeTransactions,
  type Transaction,
} from './data'

const columns = [
  { name: 'select', size: '2.5rem' },
  { name: 'date', size: '6rem' },
  { name: 'name', size: 'minmax(0, 1fr)' },
  { name: 'status', size: '7rem' },
  { name: 'amount', size: '7rem' },
]

const transactions = makeTransactions(5000)
const byId = new Map(
  transactions.map((transaction) => [transaction.id, transaction]),
)

const getKey = (transaction: Transaction) => transaction.id

function StatusBadge({ status }: { status: Transaction['status'] }) {
  return (
    <span
      className={
        status === 'posted'
          ? 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'
          : 'inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400'
      }
    >
      {status}
    </span>
  )
}

export default function ListVirtualized() {
  const store = List.useStore({
    items: transactions,
    getKey,
    selectionMode: 'multiple',
  })
  const selectedKeys = store.selection.useState('selectedKeys')
  const virtualizer = useListVirtualizer(store, {
    estimateSize: () => 44,
    overscan: 20,
  })

  return (
    <List.Root
      store={store}
      columns={columns}
      className="h-96 w-full max-w-2xl overflow-auto rounded-lg border"
      ref={virtualizer.scrollContainerRef as React.Ref<HTMLDivElement>}
    >
      <List.Spacer height={virtualizer.spacerTop} />
      {virtualizer.virtualRows.map((row) => {
        const transaction = byId.get(row.key)!
        return (
          <List.Row
            key={row.key}
            value={row.key}
            data-index={row.index}
            ref={virtualizer.measureRow}
          >
            <List.Cell column="select" className="justify-center">
              <Checkbox
                checked={selectedKeys.has(transaction.id)}
                onCheckedChange={() => {
                  store.selection.toggle(transaction.id)
                  store.setMultiSelectActive(true)
                }}
                onClick={(event) => event.stopPropagation()}
                tabIndex={-1}
                aria-label="Select row"
                className="opacity-0 group-data-[active]/row:opacity-100 group-data-[keyboard-active]/row:opacity-100 group-data-[selected]/row:opacity-100"
              />
            </List.Cell>
            <List.Cell column="date" className="text-muted-foreground">
              {formatDate(transaction.date)}
            </List.Cell>
            <List.Cell column="name" className="truncate font-medium">
              {transaction.name}
            </List.Cell>
            <List.Cell column="status">
              <StatusBadge status={transaction.status} />
            </List.Cell>
            <List.Cell column="amount" className="justify-end tabular-nums">
              <span
                className={
                  transaction.amountCents > 0 ? 'text-emerald-600' : undefined
                }
              >
                {transaction.amountCents > 0 ? '+' : ''}
                {formatAmount(transaction)}
              </span>
            </List.Cell>
          </List.Row>
        )
      })}
      <List.Spacer height={virtualizer.spacerBottom} />
    </List.Root>
  )
}
