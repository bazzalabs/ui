import { createColumnBuilder } from '@bazza-ui/data-view/react'
import {
  AlarmClockIcon,
  CalendarIcon,
  CircleDotIcon,
  FlameIcon,
  TagsIcon,
  TextIcon,
} from 'lucide-react'
import { ISSUE_STATUSES, LABELS_BY_ID } from './data'
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
    .build(),

  col
    .option()
    .id('status')
    .displayName('Status')
    .icon(CircleDotIcon)
    .accessor((d) => d.status.id)
    .sortable()
    .options(
      ISSUE_STATUSES.map((s) => ({
        label: s.name,
        value: s.id,
        icon: s.icon,
      })),
    )
    .build(),

  // Labels: inferred from data via transformValueToOptionFn
  // No static .options() — the ColumnDataService scans all rows,
  // deduplicates label ids, and maps each through this function.
  col
    .multiOption()
    .id('labels')
    .displayName('Labels')
    .icon(TagsIcon)
    .accessor((d) => d.labels?.map((l) => l.id) ?? [])
    .transformValueToOptionFn((labelId) => {
      const label = LABELS_BY_ID.get(labelId)
      return {
        label: label?.name ?? labelId,
        value: labelId,
      }
    })
    .build(),

  col
    .number()
    .id('estimatedHours')
    .displayName('Est. Hours')
    .icon(AlarmClockIcon)
    .accessor((d) => d.estimatedHours)
    .sortable()
    .build(),

  col
    .date()
    .id('startDate')
    .displayName('Start Date')
    .icon(CalendarIcon)
    .accessor((d) => d.startDate as Date)
    .sortable()
    .build(),

  col
    .boolean()
    .id('isUrgent')
    .displayName('Urgent')
    .icon(FlameIcon)
    .accessor((d) => d.isUrgent)
    .toggledStateName('Urgent')
    .build(),
] as const
