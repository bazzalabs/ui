import { createColumnBuilder } from '@bazza-ui/data-view'
import {
  AlarmClockIcon,
  CalendarIcon,
  CircleDotIcon,
  FlameIcon,
  TagsIcon,
  TextIcon,
  UserIcon,
} from 'lucide-react'
import type { Issue } from './types'

const col = createColumnBuilder<Issue>()

export const columnsConfig = [
  col
    .text()
    .id('title')
    .displayName('Title')
    .icon(TextIcon)
    .accessor((d) => d.title)
    .sortable()
    .field('title')
    .build(),

  col
    .option()
    .id('status')
    .displayName('Status')
    .icon(CircleDotIcon)
    .accessor((d) => d.status.id)
    .sortable()
    .field('status.id')
    .build(),

  col
    .option()
    .id('assignee')
    .displayName('Assignee')
    .icon(UserIcon)
    .accessor((d) => d.assignee?.id ?? '')
    .field('assignee.id')
    .build(),

  col
    .multiOption()
    .id('labels')
    .displayName('Labels')
    .icon(TagsIcon)
    .accessor((d) => d.labels?.map((l) => l.id) ?? [])
    .field('labels.id')
    .build(),

  col
    .number()
    .id('estimatedHours')
    .displayName('Est. Hours')
    .icon(AlarmClockIcon)
    .accessor((d) => d.estimatedHours)
    .sortable()
    .field('estimated_hours')
    .build(),

  col
    .date()
    .id('startDate')
    .displayName('Start Date')
    .icon(CalendarIcon)
    .accessor((d) => (d.startDate ? new Date(d.startDate) : undefined) as Date)
    .sortable()
    .field('start_date')
    .build(),

  col
    .boolean()
    .id('isUrgent')
    .displayName('Urgent')
    .icon(FlameIcon)
    .accessor((d) => d.isUrgent)
    .toggledStateName('Urgent')
    .field('is_urgent')
    .build(),
] as const
