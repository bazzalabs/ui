import { TriangleDashedIcon } from 'lucide-react'
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
    url: '/docs/dropdown-menu',
    audience: 'preview',
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
]

export const archivedComponentItems: ComponentItem[] = [
  {
    type: 'collapsible',
    title: 'Action Menu',
    urlPrefix: '/docs/action-menu',
    badge: (
      <TriangleDashedIcon className="size-3.5 !text-yellow-400 stroke-3" />
    ),
    groups: [
      {
        groupName: 'Getting Started',
        items: [
          {
            type: 'link',
            title: 'Introduction',
            url: '/docs/action-menu/introduction',
          },
          {
            type: 'link',
            title: 'Installation',
            url: '/docs/action-menu/installation',
          },
          {
            type: 'link',
            title: 'Quick Start',
            url: '/docs/action-menu/quick-start',
          },
          {
            type: 'link',
            title: 'Examples',
            url: '/docs/action-menu/examples',
          },
        ],
      },
      {
        groupName: 'Concepts',
        items: [
          {
            type: 'link',
            title: 'Data-First API',
            url: '/docs/action-menu/data-first-api',
          },
          {
            type: 'link',
            title: 'Menu Structure',
            url: '/docs/action-menu/menu-structure',
          },
          {
            type: 'link',
            title: 'Node Types',
            url: '/docs/action-menu/node-types',
          },
          {
            type: 'link',
            title: 'State Management',
            url: '/docs/action-menu/state-management',
          },
          {
            type: 'link',
            title: 'Responsive Behavior',
            url: '/docs/action-menu/responsive-behavior',
          },
        ],
      },
      {
        groupName: 'Features',
        items: [
          {
            type: 'link',
            title: 'Node Configuration',
            url: '/docs/action-menu/nodes',
          },
          {
            type: 'link',
            title: 'Async Loading',
            url: '/docs/action-menu/async',
          },
          {
            type: 'link',
            title: 'Search & Filtering',
            url: '/docs/action-menu/search',
          },
          {
            type: 'link',
            title: 'Keyboard Navigation',
            url: '/docs/action-menu/keyboard',
          },
          {
            type: 'link',
            title: 'Focus Management',
            url: '/docs/action-menu/focus',
          },
          {
            type: 'link',
            title: 'Positioning',
            url: '/docs/action-menu/positioning',
          },
          {
            type: 'link',
            title: 'Theming',
            url: '/docs/action-menu/theming',
          },
          {
            type: 'link',
            title: 'Virtualization',
            url: '/docs/action-menu/virtualization',
          },
          {
            type: 'link',
            title: 'Middleware',
            url: '/docs/action-menu/middleware',
          },
          {
            type: 'link',
            title: 'Extended Properties',
            url: '/docs/action-menu/extended-properties',
          },
          {
            type: 'link',
            title: 'Defaults',
            url: '/docs/action-menu/defaults',
          },
        ],
      },
      {
        groupName: 'Advanced',
        items: [
          {
            type: 'link',
            title: 'Loader Adapters',
            url: '/docs/action-menu/loader-adapters',
          },
          {
            type: 'link',
            title: 'Deep Search',
            url: '/docs/action-menu/deep-search',
          },
          {
            type: 'link',
            title: 'Intent Zone',
            url: '/docs/action-menu/intent-zone',
          },
          {
            type: 'link',
            title: 'Custom Rendering',
            url: '/docs/action-menu/custom-rendering',
          },
          {
            type: 'link',
            title: 'Performance Optimization',
            url: '/docs/action-menu/performance',
          },
          {
            type: 'link',
            title: 'Accessibility',
            url: '/docs/action-menu/accessibility',
          },
          {
            type: 'link',
            title: 'RTL Support',
            url: '/docs/action-menu/rtl',
          },
        ],
      },
      {
        groupName: 'Components',
        items: [
          {
            type: 'link',
            title: 'Select',
            url: '/docs/action-menu/select',
          },
          {
            type: 'link',
            title: 'MultiSelect',
            url: '/docs/action-menu/multiselect',
          },
          {
            type: 'link',
            title: 'Dropdown Menu',
            url: '/docs/action-menu/dropdown-menu',
          },
          {
            type: 'link',
            title: 'Context Menu',
            url: '/docs/action-menu/context-menu',
          },
          {
            type: 'link',
            title: 'Command Palette',
            url: '/docs/action-menu/command-palette',
          },
        ],
      },
      {
        groupName: 'Reference',
        items: [
          {
            type: 'link',
            title: 'API Reference',
            url: '/docs/action-menu/api-reference',
          },
          {
            type: 'link',
            title: 'TypeScript Types',
            url: '/docs/action-menu/typescript',
          },
        ],
      },
    ],
  },
]
