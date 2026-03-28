'use client'

import { createVanillaStaticLoader } from '@bazza-ui/react/adapters'
import type {
  ItemDef,
  ItemRenderParams,
  NodeDef,
  SubmenuDef,
  SubmenuRenderParams,
} from '@bazza-ui/react/dropdown-menu'
import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu, LabelWithBreadcrumbs } from '@/registry/ui/dropdown-menu'

// =============================================================================
// Mock Data
// =============================================================================

const TEAM_MEMBERS = [
  { id: 'alice', name: 'Alice Chen', role: 'Engineering' },
  { id: 'bob', name: 'Bob Martinez', role: 'Design' },
  { id: 'carol', name: 'Carol Johnson', role: 'Product' },
  { id: 'dave', name: 'Dave Kim', role: 'Engineering' },
  { id: 'eve', name: 'Eve Thompson', role: 'Marketing' },
]

const PROJECTS = [
  { id: 'web', name: 'Web App', status: 'Active' },
  { id: 'mobile', name: 'Mobile App', status: 'Active' },
  { id: 'api', name: 'API Platform', status: 'Active' },
  { id: 'docs', name: 'Documentation', status: 'In Progress' },
  { id: 'infra', name: 'Infrastructure', status: 'Planning' },
]

// =============================================================================
// Helper: Sleep function for simulating network delay
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// =============================================================================
// Node Factories
// =============================================================================

function createPersonItem(person: (typeof TEAM_MEMBERS)[number]): ItemDef {
  return {
    kind: 'item',
    id: person.id,
    value: person.name,
    keywords: [person.name.toLowerCase(), person.role.toLowerCase()],
    render: ({ props, context }: ItemRenderParams) => (
      <DropdownMenu.Item
        {...props}
        onSelect={() => toast(`Assigned to ${person.name}`)}
      >
        <DropdownMenu.Icon>
          <span className="text-xs font-medium">
            {person.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </span>
        </DropdownMenu.Icon>
        <LabelWithBreadcrumbs
          label={person.name}
          breadcrumbs={
            context.isDeepSearchResult ? context.breadcrumbs : undefined
          }
        />
        <DropdownMenu.Shortcut>{person.role}</DropdownMenu.Shortcut>
      </DropdownMenu.Item>
    ),
  }
}

function createProjectItem(project: (typeof PROJECTS)[number]): ItemDef {
  return {
    kind: 'item',
    id: project.id,
    value: project.name,
    keywords: [project.name.toLowerCase(), project.status.toLowerCase()],
    render: ({ props, context }: ItemRenderParams) => (
      <DropdownMenu.Item
        {...props}
        onSelect={() => toast(`Opened ${project.name}`)}
      >
        <LabelWithBreadcrumbs
          label={project.name}
          breadcrumbs={
            context.isDeepSearchResult ? context.breadcrumbs : undefined
          }
        />
        <DropdownMenu.Shortcut>{project.status}</DropdownMenu.Shortcut>
      </DropdownMenu.Item>
    ),
  }
}

// =============================================================================
// Async Loaders (vanilla - no TanStack Query needed)
// =============================================================================

const teamLoader = createVanillaStaticLoader({
  fetcher: async () => {
    await sleep(2000)
    return TEAM_MEMBERS.map(createPersonItem)
  },
})

const projectsLoader = createVanillaStaticLoader({
  fetcher: async () => {
    await sleep(3000)
    return PROJECTS.map(createProjectItem)
  },
})

// =============================================================================
// Async Submenu Factory
// =============================================================================

function createAsyncSubmenu(
  id: string,
  title: string,
  loader: ReturnType<typeof createVanillaStaticLoader>,
): SubmenuDef {
  return {
    kind: 'submenu',
    id,
    value: title,
    deepSearch: true,
    includeInDeepSearch: true,
    asyncNodes: loader,
    render: ({ props, context, asyncContent }: SubmenuRenderParams) => (
      <DropdownMenu.Submenu>
        <DropdownMenu.SubmenuTrigger {...props}>
          <LabelWithBreadcrumbs
            label={title}
            breadcrumbs={
              context.isDeepSearchResult ? context.breadcrumbs : undefined
            }
          />
        </DropdownMenu.SubmenuTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.DataSurface asyncContent={asyncContent}>
                <DropdownMenu.DataInput
                  placeholder={`Search ${title.toLowerCase()}...`}
                  hideUntilActive
                />
                <DropdownMenu.DataList>
                  {({ nodes, renderNode, count, async }) => (
                    <>
                      {nodes.map((node) => renderNode(node))}
                      <DropdownMenu.Loading />
                      {!async.isLoading && count === 0 && (
                        <DropdownMenu.Empty />
                      )}
                    </>
                  )}
                </DropdownMenu.DataList>
              </DropdownMenu.DataSurface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    ),
  }
}

// =============================================================================
// Static Items
// =============================================================================

function createStaticItem(id: string, label: string, action: string): ItemDef {
  return {
    kind: 'item',
    id,
    value: label,
    render: ({ props }: ItemRenderParams) => (
      <DropdownMenu.Item {...props} onSelect={() => toast(action)}>
        {label}
      </DropdownMenu.Item>
    ),
  }
}

// =============================================================================
// Menu Content
// =============================================================================

function buildMenuContent(): NodeDef[] {
  return [
    createStaticItem('new', 'New Item', 'Creating new item...'),
    createStaticItem('refresh', 'Refresh', 'Refreshing...'),
    { kind: 'separator', id: 'sep-1' },
    createAsyncSubmenu('team', 'Team Members', teamLoader),
    createAsyncSubmenu('projects', 'Projects', projectsLoader),
  ]
}

// =============================================================================
// Main Component
// =============================================================================

export default function DropdownMenuAsync() {
  const content = React.useMemo(() => buildMenuContent(), [])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="secondary" />}>
        Async Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.DataSurface
              content={content}
              deepSearch={{ enabled: true, minLength: 1 }}
            >
              <DropdownMenu.DataInput placeholder="Search..." />
              <DropdownMenu.DataList>
                {({ nodes, renderNode, count, async }) => (
                  <>
                    {nodes.map((node) => renderNode(node))}
                    <DropdownMenu.Loading />
                    {!async.isLoading && count === 0 && <DropdownMenu.Empty />}
                  </>
                )}
              </DropdownMenu.DataList>
            </DropdownMenu.DataSurface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
