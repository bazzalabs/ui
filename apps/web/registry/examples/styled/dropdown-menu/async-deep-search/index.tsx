'use client'

import type {
  ItemDef,
  ItemRenderParams,
  NodeDef,
  SubmenuDef,
  SubmenuRenderParams,
} from '@bazza-ui/react/dropdown-menu'
import { createQueryLoader } from '@bazza-ui/react/loaders'
import { useQuery } from '@tanstack/react-query'
import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DiamondSpinner,
  DropdownMenu,
  LabelWithBreadcrumbs,
} from '@/registry/ui/dropdown-menu'

/**
 * This example demonstrates deep search across multiple async submenus
 * using TanStack Query with query-dependent (server-side) filtering.
 *
 * Key features:
 * - **Query-dependent loading**: Each submenu fetches filtered results from the "server"
 * - **Lazy loading**: Data is only fetched when the submenu is opened or during deep search
 * - **Deep search**: Search across all submenus simultaneously
 *
 * Try it: Type "chicken" or "apple" to see server-side filtering in action!
 */

// =============================================================================
// Mock Data
// =============================================================================

const FRUITS = [
  { id: '1', name: 'Apple', emoji: '🍎' },
  { id: '2', name: 'Banana', emoji: '🍌' },
  { id: '3', name: 'Orange', emoji: '🍊' },
  { id: '4', name: 'Grape', emoji: '🍇' },
  { id: '5', name: 'Strawberry', emoji: '🍓' },
  { id: '6', name: 'Watermelon', emoji: '🍉' },
  { id: '7', name: 'Pineapple', emoji: '🍍' },
  { id: '8', name: 'Mango', emoji: '🥭' },
  { id: '9', name: 'Peach', emoji: '🍑' },
  { id: '10', name: 'Cherry', emoji: '🍒' },
]

const VEGETABLES = [
  { id: '11', name: 'Carrot', emoji: '🥕' },
  { id: '12', name: 'Broccoli', emoji: '🥦' },
  { id: '13', name: 'Spinach', emoji: '🥬' },
  { id: '14', name: 'Tomato', emoji: '🍅' },
  { id: '15', name: 'Cucumber', emoji: '🥒' },
  { id: '16', name: 'Bell Pepper', emoji: '🫑' },
  { id: '17', name: 'Lettuce', emoji: '🥗' },
  { id: '18', name: 'Onion', emoji: '🧅' },
  { id: '19', name: 'Garlic', emoji: '🧄' },
  { id: '20', name: 'Potato', emoji: '🥔' },
]

const MEATS = [
  { id: '21', name: 'Chicken', emoji: '🍗' },
  { id: '22', name: 'Beef', emoji: '🥩' },
  { id: '23', name: 'Pork', emoji: '🥓' },
  { id: '24', name: 'Turkey', emoji: '🦃' },
  { id: '25', name: 'Lamb', emoji: '🍖' },
  { id: '26', name: 'Duck', emoji: '🦆' },
  { id: '27', name: 'Fish', emoji: '🐟' },
  { id: '28', name: 'Shrimp', emoji: '🦐' },
  { id: '29', name: 'Bacon', emoji: '🥓' },
  { id: '30', name: 'Sausage', emoji: '🌭' },
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

function createFoodItemNode(id: string, name: string, emoji: string): ItemDef {
  return {
    kind: 'item',
    id,
    value: name,
    keywords: [name.toLowerCase()],
    render: ({ props, context }: ItemRenderParams) => (
      <DropdownMenu.Item
        {...props}
        onSelect={() => toast(`Selected: ${emoji} ${name}`)}
      >
        <DropdownMenu.Icon>{emoji}</DropdownMenu.Icon>
        <LabelWithBreadcrumbs
          label={name}
          breadcrumbs={
            context.isDeepSearchResult ? context.breadcrumbs : undefined
          }
        />
      </DropdownMenu.Item>
    ),
  }
}

// =============================================================================
// Async Fetch Functions (Server-side filtering simulation)
// =============================================================================

const LOAD_TIME = 30_000 as const

async function fetchFruits(search: string): Promise<NodeDef[]> {
  console.log(`[Server] Fetching fruits matching "${search}"...`)
  await sleep(LOAD_TIME)

  const filtered = search
    ? FRUITS.filter((fruit) =>
        fruit.name.toLowerCase().includes(search.toLowerCase()),
      )
    : FRUITS

  console.log(`[Server] Found ${filtered.length} fruits`)
  return filtered.map((fruit) =>
    createFoodItemNode(fruit.id, fruit.name, fruit.emoji),
  )
}

async function fetchVegetables(search: string): Promise<NodeDef[]> {
  console.log(`[Server] Fetching vegetables matching "${search}"...`)
  await sleep(LOAD_TIME)

  const filtered = search
    ? VEGETABLES.filter((veg) =>
        veg.name.toLowerCase().includes(search.toLowerCase()),
      )
    : VEGETABLES

  console.log(`[Server] Found ${filtered.length} vegetables`)
  return filtered.map((veg) => createFoodItemNode(veg.id, veg.name, veg.emoji))
}

async function fetchMeats(search: string): Promise<NodeDef[]> {
  console.log(`[Server] Fetching meats matching "${search}"...`)
  await sleep(LOAD_TIME)

  const filtered = search
    ? MEATS.filter((meat) =>
        meat.name.toLowerCase().includes(search.toLowerCase()),
      )
    : MEATS

  console.log(`[Server] Found ${filtered.length} meats`)
  return filtered.map((meat) =>
    createFoodItemNode(meat.id, meat.name, meat.emoji),
  )
}

// =============================================================================
// Query Loaders (using TanStack Query)
// =============================================================================

const fruitsLoader = createQueryLoader({
  useQuery: (query) =>
    useQuery({
      queryKey: ['fruits', query],
      queryFn: () => fetchFruits(query),
      staleTime: 1, // Cache for 30 seconds
    }),
  minQueryLength: 0, // Fetch even with empty query
  initialQuery: '', // Pre-fetch all items when submenu opens
})

const vegetablesLoader = createQueryLoader({
  useQuery: (query) =>
    useQuery({
      queryKey: ['vegetables', query],
      queryFn: () => fetchVegetables(query),
      staleTime: 1,
    }),
  minQueryLength: 0,
  initialQuery: '',
})

const meatsLoader = createQueryLoader({
  useQuery: (query) =>
    useQuery({
      queryKey: ['meats', query],
      queryFn: () => fetchMeats(query),
      staleTime: 1,
    }),
  minQueryLength: 0,
  initialQuery: '',
})

// =============================================================================
// Async Submenu Factory
// =============================================================================

function createAsyncFoodSubmenu(
  id: string,
  title: string,
  icon: string,
  loader: ReturnType<typeof createQueryLoader>,
): SubmenuDef {
  return {
    kind: 'submenu',
    id,
    value: title,
    deepSearch: true,
    includeInDeepSearch: true,
    // Lazy loading: fetches when submenu opens or during deep search
    // Use loadStrategy: 'eager' to fetch when root menu opens instead
    asyncNodes: loader,
    render: ({ props, context, asyncContent }: SubmenuRenderParams) => (
      <DropdownMenu.Submenu>
        <DropdownMenu.SubmenuTrigger {...props}>
          <div className="flex items-center gap-2 flex-1">
            <DropdownMenu.Icon>{icon}</DropdownMenu.Icon>
            <LabelWithBreadcrumbs
              label={title}
              breadcrumbs={
                context.isDeepSearchResult ? context.breadcrumbs : undefined
              }
            />
          </div>
        </DropdownMenu.SubmenuTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              {/*
                The submenu uses asyncContent as its sole data source.
                This runs its OWN loader with its OWN search query.
              */}
              <DropdownMenu.Surface asyncContent={asyncContent}>
                <DropdownMenu.Input
                  placeholder={`Search ${title.toLowerCase()}...`}
                  hideUntilActive
                />
                <DropdownMenu.List>
                  <AsyncSubmenuListContent />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    ),
  }
}

// =============================================================================
// Menu Content Builder
// =============================================================================

function buildMenuContent(): NodeDef[] {
  return [
    createAsyncFoodSubmenu('fruits', 'Fruits', '🍎', fruitsLoader),
    createAsyncFoodSubmenu('vegetables', 'Vegetables', '🥕', vegetablesLoader),
    createAsyncFoodSubmenu('meats', 'Meats', '🥩', meatsLoader),
  ]
}

// =============================================================================
// Main Component
// =============================================================================

export default function DropdownMenuAsyncDeepSearch() {
  const content = React.useMemo(() => buildMenuContent(), [])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="secondary" />}>
        Food Menu (Query-Dependent)
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              content={content}
              deepSearch={{ enabled: true, minLength: 1 }}
            >
              <DropdownMenu.Input placeholder="Search all foods..." />
              <DropdownMenu.List>
                <AsyncDeepSearchListContent />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function AsyncSubmenuListContent() {
  const {
    nodes: filteredNodes,
    renderNode,
    async,
    count,
  } = DropdownMenu.useDataList()

  return (
    <>
      {filteredNodes.map((node) => renderNode(node))}
      {async.isLoading ? (
        <div className="flex items-center h-8 w-[min(500px,max(var(--row-width,200px),200px))]">
          <div className="flex items-center justify-center text-muted-foreground w-full">
            <DiamondSpinner className="size-5" />
          </div>
        </div>
      ) : (
        count === 0 && <DropdownMenu.Empty />
      )}
    </>
  )
}

function AsyncDeepSearchListContent() {
  const { nodes, renderNode, isDeepSearching, count, async } =
    DropdownMenu.useDataList()

  return (
    <>
      {isDeepSearching && (
        <div className="px-4 py-1.5 text-xs text-muted-foreground border-b border-border bg-muted/30 -mt-1 mb-1">
          {async.isLoading ? 'Searching server...' : `Found ${count} results`}
        </div>
      )}
      {nodes.map((node) => renderNode(node))}
      {isDeepSearching && async.isLoading ? (
        <div className="flex items-center w-full h-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <DiamondSpinner className="size-5" />
            <span>Loading...</span>
          </div>
        </div>
      ) : (
        count === 0 && <DropdownMenu.Empty />
      )}
    </>
  )
}
