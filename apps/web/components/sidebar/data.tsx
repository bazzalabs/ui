import type { ComponentItem, SidebarBasicItem } from './types'

export const basicItems: SidebarBasicItem[] = [
  {
    title: 'Introduction',
    url: '/docs/intro',
  },
  {
    title: 'Getting Started',
    url: '/docs/getting-started',
  },
  {
    title: 'Feedback',
    url: '/docs/feedback',
  },
]

export const componentItems: ComponentItem[] = [
  {
    type: 'collapsible',
    title: 'Filters',
    urlPrefix: '/docs/filters',
    groups: [
      {
        groupName: 'Getting Started',
        items: [
          {
            type: 'link',
            title: 'Introduction',
            url: '/docs/filters/introduction',
          },
          {
            type: 'link',
            title: 'Installation',
            url: '/docs/filters/installation',
          },
          {
            type: 'link',
            title: 'Examples',
            url: '/docs/filters/examples',
          },
          {
            type: 'link',
            title: 'Blocks',
            url: '/docs/filters/blocks',
          },
        ],
      },
      {
        groupName: 'Components',
        items: [
          {
            type: 'link',
            title: 'Filter',
            url: '/docs/filters/components/filter',
          },
        ],
      },
      {
        groupName: 'Core',
        items: [
          {
            type: 'link',
            title: 'Anatomy',
            url: '/docs/filters/core/anatomy',
          },
          {
            type: 'link',
            title: 'Concepts',
            url: '/docs/filters/core/concepts',
          },
        ],
      },
      {
        groupName: 'Features',
        items: [
          {
            type: 'link',
            title: 'Column Builder',
            url: '/docs/filters/column-builder',
          },
          {
            type: 'link',
            title: 'Instance',
            url: '/docs/filters/instance',
          },
          {
            type: 'link',
            title: 'State Management',
            url: '/docs/filters/state-management',
          },
          {
            type: 'link',
            title: 'Faceted Values',
            url: '/docs/filters/faceted-values',
          },
          {
            type: 'link',
            title: 'Option Columns',
            url: '/docs/filters/option-columns',
          },
          {
            type: 'link',
            title: 'Columns',
            url: '/docs/filters/columns',
          },
          {
            type: 'link',
            title: 'Operators',
            url: '/docs/filters/operators',
          },
          {
            type: 'link',
            title: 'Actions',
            url: '/docs/filters/actions',
          },
          {
            type: 'link',
            title: 'Filtering Data',
            url: '/docs/filters/filtering-data',
          },
          {
            type: 'link',
            title: 'Internationalization',
            url: '/docs/filters/i18n',
          },
        ],
      },
      {
        groupName: 'Integrations',
        items: [
          {
            type: 'link',
            title: 'TanStack Table',
            url: '/docs/filters/integrations/tanstack-table',
          },
          {
            type: 'link',
            title: 'nuqs',
            url: '/docs/filters/integrations/nuqs',
          },
        ],
      },
    ],
  },
  {
    type: 'single',
    title: 'Dropdown Menu',
    url: '/docs/components/dropdown-menu',
    audience: 'private',
  },
  {
    type: 'single',
    title: 'Context Menu',
    url: '/docs/context-menu',
    audience: 'private',
  },
  {
    type: 'single',
    title: 'Select',
    url: '/docs/select',
    audience: 'private',
  },
  {
    type: 'single',
    title: 'Combobox',
    url: '/docs/combobox',
    audience: 'private',
  },
  {
    type: 'single',
    title: 'Video Player',
    url: '/docs/video-player',
    audience: 'private',
  },
  {
    type: 'single',
    title: 'List',
    url: '/docs/list',
    audience: 'private',
  },
]
