import type { DataViewState } from '@bazza-ui/data-view/react'

// Ensure the module augmentation in ./types is loaded
import type {} from './types'

/**
 * Preset views — built-in views that cannot be edited or deleted.
 * Each is a DataViewState with `meta.isPreset: true`.
 */
export const PRESET_VIEWS: DataViewState[] = [
  {
    id: 'all',
    name: 'All Issues',
    filters: [],
    sort: [],
    meta: {
      description: 'Every issue in the project, unfiltered.',
      isPreset: true,
    },
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
    sort: [{ type: 'column', columnId: 'estimatedHours', direction: 'desc' }],
    meta: {
      description:
        'Issues tagged with the Bug label, sorted by estimated hours.',
      isPreset: true,
    },
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
    sort: [{ type: 'column', columnId: 'startDate', direction: 'desc' }],
    meta: {
      description:
        'Issues currently being worked on, most recently started first.',
      isPreset: true,
    },
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
    sort: [{ type: 'column', columnId: 'estimatedHours', direction: 'asc' }],
    meta: {
      description: 'Urgent issues sorted by lowest estimated hours first.',
      isPreset: true,
    },
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
    sort: [{ type: 'column', columnId: 'title', direction: 'asc' }],
    meta: {
      description: 'Backlog issues sorted alphabetically by title.',
      isPreset: true,
    },
  },
  {
    id: 'frontend',
    name: 'Frontend',
    filters: [
      {
        columnId: 'labels',
        type: 'multiOption',
        operator: 'include',
        values: ['l5'],
      },
    ],
    sort: [{ type: 'column', columnId: 'status', direction: 'asc' }],
    meta: {
      description: 'Issues tagged with the Frontend label, sorted by status.',
      isPreset: true,
    },
  },
]

/** The default view to load initially. */
export const DEFAULT_VIEW = PRESET_VIEWS[0]!
