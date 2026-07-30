'use client'

import { toast } from 'sonner'
import { List } from '@/registry/ui/list'
import {
  formatAmount,
  formatDate,
  type Transaction,
  transactions,
} from './data'

const columns = [
  { name: 'date', size: '6rem' },
  { name: 'name', size: 'minmax(0, 1fr)' },
  { name: 'status', size: '7rem' },
  { name: 'amount', size: '7rem' },
]

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

export default function ListBasic() {
  const store = List.useStore({
    items: transactions,
    getKey: (transaction) => transaction.id,
    selectionMode: 'multiple',
    onAction: (key) => toast(`Opened ${key}`),
  })

  return (
    <List.Root
      store={store}
      columns={columns}
      className="max-h-96 w-full max-w-2xl overflow-auto rounded-lg border"
    >
      {transactions.map((transaction) => (
        <List.Row key={transaction.id} value={transaction.id}>
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
      ))}
    </List.Root>
  )
}
