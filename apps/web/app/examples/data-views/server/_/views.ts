import type { DataViewState } from '@bazza-ui/data-view/react'
import type {} from './types' // import module augmentation

export const PRESET_VIEWS: DataViewState[] = [
  {
    id: 'all',
    name: 'All Issues',
    filters: [],
    sort: [],
    meta: { isPreset: true },
  },
  {
    id: 'bugs',
    name: 'Bugs',
    filters: [
      {
        columnId: 'labels',
        type: 'multiOption',
        operator: 'include',
        values: ['l1'],
      },
    ],
    sort: [
      {
        type: 'column',
        columnId: 'estimatedHours',
        direction: 'desc',
      },
    ],
    meta: { isPreset: true, description: 'Issues labeled as bugs' },
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    filters: [
      {
        columnId: 'status',
        type: 'option',
        operator: 'is',
        values: ['in-progress'],
      },
    ],
    sort: [
      {
        type: 'column',
        columnId: 'startDate',
        direction: 'desc',
      },
    ],
    meta: { isPreset: true, description: 'Currently being worked on' },
  },
  {
    id: 'urgent',
    name: 'Urgent',
    filters: [
      {
        columnId: 'isUrgent',
        type: 'boolean',
        operator: 'is',
        values: [true],
      },
    ],
    sort: [
      {
        type: 'column',
        columnId: 'estimatedHours',
        direction: 'asc',
      },
    ],
    meta: { isPreset: true, description: 'High-priority issues' },
  },
  {
    id: 'backlog',
    name: 'Backlog',
    filters: [
      {
        columnId: 'status',
        type: 'option',
        operator: 'is',
        values: ['backlog'],
      },
    ],
    sort: [
      {
        type: 'column',
        columnId: 'title',
        direction: 'asc',
      },
    ],
    meta: { isPreset: true, description: 'Not yet planned' },
  },
]

export const DEFAULT_VIEW = PRESET_VIEWS[0]!
