import type { DurationUnit } from '@bazza-ui/filters'
import { createColumnConfigHelper } from '@bazza-ui/filters'
import {
  CalendarArrowUpIcon,
  CircleDotDashedIcon,
  ClockIcon,
  GaugeIcon,
  Heading1Icon,
  TagsIcon,
  UserCheckIcon,
} from 'lucide-react'
import type { Issue } from './types'

declare module '@bazza-ui/filters' {
  interface ColumnMeta {
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
    .build(),
  dtf
    .option()
    .accessor((row) => row.status.id)
    .id('status')
    .displayName('Status')
    .icon(CircleDotDashedIcon)
    .build(),
  dtf
    .option()
    .accessor((row) => row.assignee?.id)
    .id('assignee')
    .displayName('Assignee')
    .icon(UserCheckIcon)
    .build(),
  dtf
    .multiOption()
    .accessor((row) => row.labels?.map((l) => l.id))
    .id('labels')
    .displayName('Labels')
    .icon(TagsIcon)
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
] as const
