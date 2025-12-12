'use client'

import {
  createColumnConfigHelper,
  useDataTableFilters,
} from '@bazza-ui/filters'
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotDashedIcon,
  CircleDotIcon,
  CircleIcon,
  Heading1Icon,
  type LucideIcon,
} from 'lucide-react'
import { Filter } from '@/registry/ui/filter'

export default function FilterVariants() {
  return (
    <div className="flex flex-col gap-y-8">
      <div className="space-y-2">
        <pre className="font-mono">variant: 'default'</pre>
        <Filters variant="default" />
      </div>
      <div className="space-y-2">
        <pre className="font-mono">variant: 'clean'</pre>
        <Filters variant="clean" />
      </div>
    </div>
  )
}

export const Filters = ({
  variant,
}: Pick<Filter.Provider.Props, 'variant'>) => {
  const { columns, filters, actions, strategy, entityName } =
    useDataTableFilters({
      data: [],
      strategy: 'client',
      entityName: 'Issue',
      columnsConfig,
      defaultFilters: [
        {
          columnId: 'title',
          type: 'text',
          operator: 'contains',
          values: ['report'],
        },
        {
          columnId: 'status',
          type: 'option',
          operator: 'is any of',
          values: ['todo', 'in-progress'],
        },
      ],
    })

  return (
    <Filter.Provider
      variant={variant}
      filters={filters}
      columns={columns}
      actions={actions}
      strategy={strategy}
      entityName={entityName}
    >
      <Filter.Root>
        <div className="flex md:flex-wrap gap-2 w-full flex-1">
          <Filter.List>
            {({ filter, column }) => (
              <Filter.Item filter={filter} column={column}>
                <Filter.Subject />
                {/*<Filter.Separator />*/}
                <Filter.Operator />
                {/*<Filter.Separator />*/}
                <Filter.Value />
                {/*<Filter.Separator />*/}
                <Filter.Remove />
              </Filter.Item>
            )}
          </Filter.List>
        </div>
      </Filter.Root>
    </Filter.Provider>
  )
}

export type IssueStatus = {
  id: 'backlog' | 'todo' | 'in-progress' | 'done'
  name: string
  icon: LucideIcon
}

export type Issue = {
  id: string
  title: string
  status: IssueStatus
}

export const ISSUE_STATUSES: IssueStatus[] = [
  {
    id: 'backlog',
    name: 'Backlog',
    icon: CircleDashedIcon,
  },
  {
    id: 'todo',
    name: 'Todo',
    icon: CircleIcon,
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    icon: CircleDotIcon,
  },
  {
    id: 'done',
    name: 'Done',
    icon: CircleCheckIcon,
  },
] as const

const dtf = createColumnConfigHelper<Issue>()

export const columnsConfig = [
  dtf
    .text()
    .id('title')
    .accessor((row) => row.title)
    .displayName('Title')
    .icon(Heading1Icon)
    .meta({
      foo: 'bar',
    })
    .build(),
  dtf
    .option()
    .accessor((row) => row.status.id)
    .id('status')
    .displayName('Status')
    .icon(CircleDotDashedIcon)
    .options(
      ISSUE_STATUSES.map((s) => ({ value: s.id, label: s.name, icon: s.icon })),
    )
    .build(),
] as const
