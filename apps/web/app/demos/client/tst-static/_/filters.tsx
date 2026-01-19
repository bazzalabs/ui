import type { DurationUnit } from '@bazza-ui/filters'
import { createColumnConfigHelper } from '@bazza-ui/filters'
import {
  CalendarArrowUpIcon,
  CircleAlertIcon,
  CircleDotDashedIcon,
  ClockIcon,
  GaugeIcon,
  Heading1Icon,
  TagsIcon,
  UserCheckIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { LABEL_STYLES_BG, type TW_COLOR } from './columns'
import { ISSUE_STATUSES } from './data'
import type { Issue } from './types'

declare module '@bazza-ui/filters' {
  interface ColumnMeta {
    foo?: string
    /** Configuration for number columns with unit support */
    number?: {
      /** The base unit the column stores values in */
      unit?: DurationUnit
    }
  }
}

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
  dtf
    .option()
    .accessor((row) => row.assignee)
    .id('assignee')
    .displayName('Assignee')
    .icon(UserCheckIcon)
    .transformValueToOptionFn((u) => ({
      value: u.id,
      label: u.name,
      icon: (
        <Avatar className="size-4">
          <AvatarImage src={u.picture} />
          <AvatarFallback>
            {u.name
              .split('')
              .map((x) => x[0])
              .join('')
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ),
    }))
    .orderFn(['count', 'desc'], ['label', 'asc'])
    .build(),
  dtf
    .multiOption()
    .accessor((row) => row.labels)
    .id('labels')
    .displayName('Labels')
    .icon(TagsIcon)
    .transformValueToOptionFn((l) => ({
      value: l.id,
      label: l.name,
      icon: () => (
        <div
          className={cn(
            'size-2.5 rounded-full',
            LABEL_STYLES_BG[l.color as TW_COLOR],
          )}
        />
      ),
    }))
    .orderFn(['count', 'desc'], ['label', 'asc'])
    .build(),
  dtf
    .number()
    .accessor((row) => row.estimatedHours)
    .id('estimatedHours')
    .displayName('Estimated hours')
    .icon(ClockIcon)
    .min(0)
    .max(100)
    .meta({
      // Enable duration unit parsing - values are stored in hours
      // User can type "1hr", "30min", "2d" and it converts to hours
      number: { unit: 'hours' },
    })
    .build(),
  dtf
    .number()
    .accessor((row) => row.priority)
    .id('priority')
    .displayName('Priority')
    .icon(GaugeIcon)
    .min(1)
    .max(100)
    // No unit config - plain number filtering
    .build(),
  dtf
    .date()
    .accessor((row) => row.startDate)
    .id('startDate')
    .displayName('Start Date')
    .icon(CalendarArrowUpIcon)
    .build(),
  dtf
    .boolean()
    .id('isUrgent')
    .accessor((row) => row.isUrgent)
    .displayName('Urgent issues')
    .toggledStateName('urgent')
    .icon(CircleAlertIcon)
    .build(),
] as const
