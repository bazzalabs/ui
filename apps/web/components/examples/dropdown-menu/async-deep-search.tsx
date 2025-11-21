'use client'

import type { ItemDef, SubmenuDef } from '@bazza-ui/dropdown-menu'
import { queryLoader } from '@bazza-ui/loaders'
import { sleep } from '@/app/demos/server/tst-query/_/utils'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/dropdown-menu'

/**
 * This example demonstrates deep search across multiple async submenus
 * using the query loader from @bazza-ui/loaders.
 *
 * Key features:
 * - **Deep search**: Setting `deepSearch: true` enables parallel loading of all submenus
 *   when a search query is active, instead of loading them one-by-one
 * - **Aggregated loading state**: Shows loading indicator until ALL deep search loaders complete
 * - **Silent error handling**: If one loader fails, results from successful loaders are shown
 * - **Automatic query propagation**: Search query is passed to all deep search loaders automatically
 *
 * Try it: Type "chicken" to see all loaders execute in parallel and results combined!
 */
export function DropdownMenu_AsyncDeepSearch() {
  const submenus: SubmenuDef[] = [
    {
      kind: 'submenu',
      id: 'fruits',
      label: 'Fruits',
      icon: '🍎',
      title: 'Fruits',
      // deepSearch: true enables parallel loading during deep search
      deepSearch: true,
      loader: queryLoader(({ query }) => ({
        queryKey: ['fruits', query],
        queryFn: () => fetchFruits(query),
        retry: false,
      })),
    },
    {
      kind: 'submenu',
      id: 'vegetables',
      label: 'Vegetables',
      icon: '🥕',
      title: 'Vegetables',
      deepSearch: true,
      loader: queryLoader(({ query }) => ({
        queryKey: ['vegetables', query],
        queryFn: () => fetchVegetables(query),
        retry: false,
      })),
    },
    {
      kind: 'submenu',
      id: 'meats',
      label: 'Meats',
      icon: '🥩',
      title: 'Meats',
      deepSearch: true,
      loader: queryLoader(({ query }) => ({
        queryKey: ['meats', query],
        queryFn: () => fetchMeats(query),
        retry: false,
      })),
    },
  ]

  return (
    <DropdownMenu
      menu={{
        id: 'root',
        nodes: submenus,
      }}
    >
      <DropdownMenu.Trigger asChild>
        <Button variant="secondary">Food Menu (Deep Search)</Button>
      </DropdownMenu.Trigger>
    </DropdownMenu>
  )
}

// Mock data and fetch functions

const FRUITS = [
  { id: '1', name: 'Apple', color: 'red', emoji: '🍎' },
  { id: '2', name: 'Banana', color: 'yellow', emoji: '🍌' },
  { id: '3', name: 'Orange', color: 'orange', emoji: '🍊' },
  { id: '4', name: 'Grape', color: 'purple', emoji: '🍇' },
  { id: '5', name: 'Strawberry', color: 'red', emoji: '🍓' },
  { id: '6', name: 'Watermelon', color: 'green', emoji: '🍉' },
  { id: '7', name: 'Pineapple', color: 'yellow', emoji: '🍍' },
  { id: '8', name: 'Mango', color: 'orange', emoji: '🥭' },
  { id: '9', name: 'Peach', color: 'pink', emoji: '🍑' },
  { id: '10', name: 'Cherry', color: 'red', emoji: '🍒' },
]

const VEGETABLES = [
  { id: '11', name: 'Carrot', color: 'orange', emoji: '🥕' },
  { id: '12', name: 'Broccoli', color: 'green', emoji: '🥦' },
  { id: '13', name: 'Spinach', color: 'green', emoji: '🥬' },
  { id: '14', name: 'Tomato', color: 'red', emoji: '🍅' },
  { id: '15', name: 'Cucumber', color: 'green', emoji: '🥒' },
  { id: '16', name: 'Bell Pepper', color: 'red', emoji: '🫑' },
  { id: '17', name: 'Lettuce', color: 'green', emoji: '🥗' },
  { id: '18', name: 'Onion', color: 'purple', emoji: '🧅' },
  { id: '19', name: 'Garlic', color: 'white', emoji: '🧄' },
  { id: '20', name: 'Potato', color: 'yellow', emoji: '🥔' },
]

const MEATS = [
  { id: '21', name: 'Chicken', color: 'yellow', emoji: '🍗' },
  { id: '22', name: 'Beef', color: 'red', emoji: '🥩' },
  { id: '23', name: 'Pork', color: 'pink', emoji: '🥓' },
  { id: '24', name: 'Turkey', color: 'brown', emoji: '🦃' },
  { id: '25', name: 'Lamb', color: 'red', emoji: '🍖' },
  { id: '26', name: 'Duck', color: 'brown', emoji: '🦆' },
  { id: '27', name: 'Fish', color: 'blue', emoji: '🐟' },
  { id: '28', name: 'Shrimp', color: 'pink', emoji: '🦐' },
  { id: '29', name: 'Bacon', color: 'red', emoji: '🥓' },
  { id: '30', name: 'Sausage', color: 'brown', emoji: '🌭' },
]

async function fetchFruits(search?: string): Promise<ItemDef[]> {
  console.log(`Fetching fruits${search ? ` matching "${search}"` : ''}...`)

  // Simulate network delay
  await sleep(800)

  const filtered = search
    ? FRUITS.filter((fruit) =>
        fruit.name.toLowerCase().includes(search.toLowerCase()),
      )
    : FRUITS

  return filtered.map((fruit) => ({
    kind: 'item' as const,
    id: fruit.id,
    label: fruit.name,
    keywords: [fruit.name.toLowerCase()],
    icon: fruit.emoji,
    onSelect: () => console.log('Selected:', fruit.name),
  }))
}

async function fetchVegetables(search?: string): Promise<ItemDef[]> {
  console.log(`Fetching vegetables${search ? ` matching "${search}"` : ''}...`)

  // Simulate different network delay
  await sleep(1200)

  const filtered = search
    ? VEGETABLES.filter((veg) =>
        veg.name.toLowerCase().includes(search.toLowerCase()),
      )
    : VEGETABLES

  return filtered.map((veg) => ({
    kind: 'item' as const,
    id: veg.id,
    label: veg.name,
    keywords: [veg.name.toLowerCase()],
    icon: veg.emoji,
    onSelect: () => console.log('Selected:', veg.name),
  }))
}

async function fetchMeats(search?: string): Promise<ItemDef[]> {
  console.log(`Fetching meats${search ? ` matching "${search}"` : ''}...`)

  // Simulate yet another network delay
  await sleep(1000)

  const filtered = search
    ? MEATS.filter((meat) =>
        meat.name.toLowerCase().includes(search.toLowerCase()),
      )
    : MEATS

  return filtered.map((meat) => ({
    kind: 'item' as const,
    id: meat.id,
    label: meat.name,
    keywords: [meat.name.toLowerCase()],
    icon: meat.emoji,
    onSelect: () => console.log('Selected:', meat.name),
  }))
}
