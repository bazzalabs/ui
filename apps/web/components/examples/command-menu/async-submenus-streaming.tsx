'use client'

import { query } from '@bazza-ui/loaders/query'
import type { ItemDef } from '@bazza-ui/menu'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UtensilsIcon } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/app/demos/server/tst-query/_/utils'
import { Button } from '@/components/ui/button'
import { CommandMenu } from '@/registry/command-menu'

const queryClient = new QueryClient()

export function CommandMenu_AsyncSubmenusStreaming() {
  return (
    <QueryClientProvider client={queryClient}>
      <CommandMenu
        trigger={
          <Button variant="ghost" className="group">
            <UtensilsIcon className="text-muted-foreground group-hover:text-primary group-aria-expanded:text-primary" />
            What's in the fridge?
          </Button>
        }
        menu={{
          id: 'root',
          search: {
            streaming: {
              enabled: true,
              resortOnBatch: false,
            },
          },
          defaults: {
            item: {
              onSelect: ({ node }) => {
                toast(`${node.icon} ${node.label}`)
              },
            },
          },
          nodes: [
            {
              kind: 'submenu',
              id: 'fruits',
              label: 'Fruits',
              deepSearch: true,
              search: {
                mode: 'server',
              },
              loader: query(({ query }) => ({
                key: ['fruits', query],
                fn: () => fetchFruits(query),
                retry: false,
              })),
            },
            {
              kind: 'submenu',
              id: 'vegetables',
              label: 'Vegetables',
              deepSearch: true,
              search: {
                mode: 'server',
              },
              loader: query(({ query }) => ({
                key: ['vegetables', query],
                fn: () => fetchVegetables(query),
                retry: false,
              })),
            },
            {
              kind: 'submenu',
              id: 'meats',
              label: 'Meats & Protein',
              deepSearch: true,
              search: {
                mode: 'server',
              },
              loader: query(({ query }) => ({
                key: ['meats', query],
                fn: () => fetchMeats(query),
                retry: false,
              })),
            },
            {
              kind: 'submenu',
              id: 'seafood',
              label: 'Seafood',
              deepSearch: true,
              search: {
                mode: 'server',
                streaming: {
                  enabled: true,
                  resortOnBatch: false,
                },
              },
              loader: query(({ query }) => ({
                key: ['seafood', query],
                fn: () => fetchSeafood(query),
                retry: false,
              })),
            },
            {
              kind: 'submenu',
              id: 'bakery',
              label: 'Bakery & Grains',
              deepSearch: true,
              search: {
                mode: 'server',
              },
              loader: query(({ query }) => ({
                key: ['bakery', query],
                fn: () => fetchBakery(query),
                retry: false,
              })),
            },
            {
              kind: 'submenu',
              id: 'meals',
              label: 'Meals & Prepared',
              deepSearch: true,
              search: {
                mode: 'server',
              },
              loader: query(({ query }) => ({
                key: ['meals', query],
                fn: () => fetchMeals(query),
                retry: false,
              })),
            },
            {
              kind: 'submenu',
              id: 'sweets',
              label: 'Sweets & Desserts',
              deepSearch: true,
              search: {
                mode: 'server',
              },
              loader: query(({ query }) => ({
                key: ['sweets', query],
                fn: () => fetchSweets(query),
                retry: false,
              })),
            },
            {
              kind: 'submenu',
              id: 'snacks',
              label: 'Snacks & Nuts',
              deepSearch: true,
              search: {
                mode: 'server',
              },
              loader: query(({ query }) => ({
                key: ['snacks', query],
                fn: () => fetchSnacks(query),
                retry: false,
              })),
            },
            {
              kind: 'submenu',
              id: 'dairy',
              label: 'Dairy & Eggs',
              deepSearch: true,
              search: {
                mode: 'server',
              },
              loader: query(({ query }) => ({
                key: ['dairy', query],
                fn: () => fetchDairy(query),
                retry: false,
              })),
            },
            {
              kind: 'submenu',
              id: 'condiments',
              label: 'Condiments & Staples',
              deepSearch: true,
              search: {
                mode: 'server',
              },
              loader: query(({ query }) => ({
                key: ['condiments', query],
                fn: () => fetchCondiments(query),
                retry: false,
              })),
            },
            {
              kind: 'submenu',
              id: 'drinks',
              label: 'Drinks',
              deepSearch: true,
              search: {
                mode: 'server',
              },
              loader: query(({ query }) => ({
                key: ['drinks', query],
                fn: () => fetchDrinks(query),
                retry: false,
              })),
            },
          ],
        }}
      />
    </QueryClientProvider>
  )
}

// Mock data fetching functions
async function fetchFruits(query?: string): Promise<ItemDef[]> {
  await sleep(2000)

  return [
    {
      kind: 'item',
      id: 'fruit-apple-red',
      label: 'Apple',
      icon: '🍎',
    },
    {
      kind: 'item',
      id: 'fruit-apple-green',
      label: 'Green Apple',
      icon: '🍏',
    },
    {
      kind: 'item',
      id: 'fruit-pear',
      label: 'Pear',
      icon: '🍐',
    },
    {
      kind: 'item',
      id: 'fruit-tangerine',
      label: 'Tangerine',
      icon: '🍊',
    },
    {
      kind: 'item',
      id: 'fruit-lemon',
      label: 'Lemon',
      icon: '🍋',
    },
    {
      kind: 'item',
      id: 'fruit-banana',
      label: 'Banana',
      icon: '🍌',
    },
    {
      kind: 'item',
      id: 'fruit-watermelon',
      label: 'Watermelon',
      icon: '🍉',
    },
    {
      kind: 'item',
      id: 'fruit-grapes',
      label: 'Grapes',
      icon: '🍇',
    },
    {
      kind: 'item',
      id: 'fruit-strawberry',
      label: 'Strawberry',
      icon: '🍓',
    },
    {
      kind: 'item',
      id: 'fruit-blueberries',
      label: 'Blueberries',
      icon: '🫐',
    },
    {
      kind: 'item',
      id: 'fruit-cherries',
      label: 'Cherries',
      icon: '🍒',
    },
    {
      kind: 'item',
      id: 'fruit-peach',
      label: 'Peach',
      icon: '🍑',
    },
    {
      kind: 'item',
      id: 'fruit-mango',
      label: 'Mango',
      icon: '🥭',
    },
    {
      kind: 'item',
      id: 'fruit-pineapple',
      label: 'Pineapple',
      icon: '🍍',
    },
    {
      kind: 'item',
      id: 'fruit-coconut',
      label: 'Coconut',
      icon: '🥥',
    },
    {
      kind: 'item',
      id: 'fruit-kiwi',
      label: 'Kiwi',
      icon: '🥝',
    },
    {
      kind: 'item',
      id: 'fruit-melon',
      label: 'Melon',
      icon: '🍈',
    },
    {
      kind: 'item',
      id: 'fruit-tomato',
      label: 'Tomato',
      icon: '🍅',
    },
    {
      kind: 'item',
      id: 'fruit-olive',
      label: 'Olive',
      icon: '🫒',
    },
  ].filter((item) =>
    item.label.toLowerCase().includes(query?.toLowerCase() ?? ''),
  ) as ItemDef[]
}

async function fetchVegetables(query?: string): Promise<ItemDef[]> {
  await sleep(1500)

  return [
    {
      kind: 'item',
      id: 'veg-eggplant',
      label: 'Eggplant',
      icon: '🍆',
    },
    {
      kind: 'item',
      id: 'veg-avocado',
      label: 'Avocado',
      icon: '🥑',
    },
    {
      kind: 'item',
      id: 'veg-broccoli',
      label: 'Broccoli',
      icon: '🥦',
    },
    {
      kind: 'item',
      id: 'veg-leafy-green',
      label: 'Leafy Green',
      icon: '🥬',
    },
    {
      kind: 'item',
      id: 'veg-cucumber',
      label: 'Cucumber',
      icon: '🥒',
    },
    {
      kind: 'item',
      id: 'veg-hot-pepper',
      label: 'Hot Pepper',
      icon: '🌶',
    },
    {
      kind: 'item',
      id: 'veg-bell-pepper',
      label: 'Bell Pepper',
      icon: '🫑',
    },
    {
      kind: 'item',
      id: 'veg-garlic',
      label: 'Garlic',
      icon: '🧄',
    },
    {
      kind: 'item',
      id: 'veg-onion',
      label: 'Onion',
      icon: '🧅',
    },
    {
      kind: 'item',
      id: 'veg-carrot',
      label: 'Carrot',
      icon: '🥕',
    },
    {
      kind: 'item',
      id: 'veg-corn',
      label: 'Ear of Corn',
      icon: '🌽',
    },
    {
      kind: 'item',
      id: 'veg-potato',
      label: 'Potato',
      icon: '🥔',
    },
    {
      kind: 'item',
      id: 'veg-mushroom',
      label: 'Mushroom',
      icon: '🍄',
    },
    {
      kind: 'item',
      id: 'veg-sweet-potato',
      label: 'Roasted Sweet Potato',
      icon: '🍠',
    },
    {
      kind: 'item',
      id: 'veg-beans',
      label: 'Beans',
      icon: '🫘',
    },
    {
      kind: 'item',
      id: 'veg-peas',
      label: 'Pea Pod',
      icon: '🫛',
    },
    {
      kind: 'item',
      id: 'veg-ginger',
      label: 'Ginger Root',
      icon: '🫚',
    },
  ].filter((item) =>
    item.label.toLowerCase().includes(query?.toLowerCase() ?? ''),
  ) as ItemDef[]
}

async function fetchMeats(query?: string): Promise<ItemDef[]> {
  await sleep(2500)

  return [
    {
      kind: 'item',
      id: 'protein-bacon',
      label: 'Bacon',
      icon: '🥓',
    },
    {
      kind: 'item',
      id: 'protein-cut-of-meat',
      label: 'Cut of Meat',
      icon: '🥩',
    },
    {
      kind: 'item',
      id: 'protein-poultry-leg',
      label: 'Poultry Leg',
      icon: '🍗',
    },
    {
      kind: 'item',
      id: 'protein-meat-on-bone',
      label: 'Meat on Bone',
      icon: '🍖',
    },
    {
      kind: 'item',
      id: 'protein-egg',
      label: 'Egg',
      icon: '🥚',
    },
    {
      kind: 'item',
      id: 'protein-fried-egg',
      label: 'Fried Egg',
      icon: '🍳',
    },
  ].filter((item) =>
    item.label.toLowerCase().includes(query?.toLowerCase() ?? ''),
  ) as ItemDef[]
}

async function fetchSeafood(query?: string): Promise<ItemDef[]> {
  await sleep(1800)

  return [
    {
      kind: 'item',
      id: 'seafood-fish',
      label: 'Fish',
      icon: '🐟',
    },
    {
      kind: 'item',
      id: 'seafood-tropical-fish',
      label: 'Tropical Fish',
      icon: '🐠',
    },
    {
      kind: 'item',
      id: 'seafood-shrimp',
      label: 'Shrimp',
      icon: '🦐',
    },
    {
      kind: 'item',
      id: 'seafood-lobster',
      label: 'Lobster',
      icon: '🦞',
    },
    {
      kind: 'item',
      id: 'seafood-crab',
      label: 'Crab',
      icon: '🦀',
    },
    {
      kind: 'item',
      id: 'seafood-squid',
      label: 'Squid',
      icon: '🦑',
    },
    {
      kind: 'item',
      id: 'seafood-oyster',
      label: 'Oyster',
      icon: '🦪',
    },
    {
      kind: 'item',
      id: 'seafood-octopus',
      label: 'Octopus',
      icon: '🐙',
    },
  ].filter((item) =>
    item.label.toLowerCase().includes(query?.toLowerCase() ?? ''),
  ) as ItemDef[]
}

async function fetchBakery(query?: string): Promise<ItemDef[]> {
  await sleep(1200)

  return [
    {
      kind: 'item',
      id: 'bakery-bread',
      label: 'Bread',
      icon: '🍞',
    },
    {
      kind: 'item',
      id: 'bakery-croissant',
      label: 'Croissant',
      icon: '🥐',
    },
    {
      kind: 'item',
      id: 'bakery-baguette',
      label: 'Baguette',
      icon: '🥖',
    },
    {
      kind: 'item',
      id: 'bakery-flatbread',
      label: 'Flatbread',
      icon: '🫓',
    },
    {
      kind: 'item',
      id: 'bakery-bagel',
      label: 'Bagel',
      icon: '🥯',
    },
    {
      kind: 'item',
      id: 'bakery-pancakes',
      label: 'Pancakes',
      icon: '🥞',
    },
    {
      kind: 'item',
      id: 'bakery-waffle',
      label: 'Waffle',
      icon: '🧇',
    },
  ].filter((item) =>
    item.label.toLowerCase().includes(query?.toLowerCase() ?? ''),
  ) as ItemDef[]
}

async function fetchMeals(query?: string): Promise<ItemDef[]> {
  await sleep(3000)

  return [
    {
      kind: 'item',
      id: 'meal-hamburger',
      label: 'Hamburger',
      icon: '🍔',
    },
    {
      kind: 'item',
      id: 'meal-hot-dog',
      label: 'Hot Dog',
      icon: '🌭',
    },
    {
      kind: 'item',
      id: 'meal-fries',
      label: 'French Fries',
      icon: '🍟',
    },
    {
      kind: 'item',
      id: 'meal-pizza',
      label: 'Pizza',
      icon: '🍕',
    },
    {
      kind: 'item',
      id: 'meal-sandwich',
      label: 'Sandwich',
      icon: '🥪',
    },
    {
      kind: 'item',
      id: 'meal-stuffed-flatbread',
      label: 'Stuffed Flatbread',
      icon: '🥙',
    },
    {
      kind: 'item',
      id: 'meal-taco',
      label: 'Taco',
      icon: '🌮',
    },
    {
      kind: 'item',
      id: 'meal-burrito',
      label: 'Burrito',
      icon: '🌯',
    },
    {
      kind: 'item',
      id: 'meal-green-salad',
      label: 'Green Salad',
      icon: '🥗',
    },
    {
      kind: 'item',
      id: 'meal-shallow-pan',
      label: 'Shallow Pan of Food',
      icon: '🥘',
    },
    {
      kind: 'item',
      id: 'meal-pot-of-food',
      label: 'Pot of Food',
      icon: '🍲',
    },
    {
      kind: 'item',
      id: 'meal-curry-rice',
      label: 'Curry Rice',
      icon: '🍛',
    },
    {
      kind: 'item',
      id: 'meal-spaghetti',
      label: 'Spaghetti',
      icon: '🍝',
    },
    {
      kind: 'item',
      id: 'meal-steaming-bowl',
      label: 'Steaming Bowl (Ramen)',
      icon: '🍜',
    },
    {
      kind: 'item',
      id: 'meal-sushi',
      label: 'Sushi',
      icon: '🍣',
    },
    {
      kind: 'item',
      id: 'meal-bento',
      label: 'Bento Box',
      icon: '🍱',
    },
    {
      kind: 'item',
      id: 'meal-fried-shrimp',
      label: 'Fried Shrimp',
      icon: '🍤',
    },
    {
      kind: 'item',
      id: 'meal-oden',
      label: 'Oden',
      icon: '🍢',
    },
    {
      kind: 'item',
      id: 'meal-fish-cake',
      label: 'Fish Cake with Swirl',
      icon: '🍥',
    },
    {
      kind: 'item',
      id: 'meal-dumpling',
      label: 'Dumpling',
      icon: '🥟',
    },
    {
      kind: 'item',
      id: 'meal-fortune-cookie',
      label: 'Fortune Cookie',
      icon: '🥠',
    },
    {
      kind: 'item',
      id: 'meal-takeout',
      label: 'Takeout Box',
      icon: '🥡',
    },
    {
      kind: 'item',
      id: 'meal-tamale',
      label: 'Tamale',
      icon: '🫔',
    },
    {
      kind: 'item',
      id: 'meal-fondue',
      label: 'Fondue',
      icon: '🫕',
    },
    {
      kind: 'item',
      id: 'meal-falafel',
      label: 'Falafel',
      icon: '🧆',
    },
    {
      kind: 'item',
      id: 'meal-bowl-with-spoon',
      label: 'Bowl with Spoon',
      icon: '🥣',
    },
  ].filter((item) =>
    item.label.toLowerCase().includes(query?.toLowerCase() ?? ''),
  ) as ItemDef[]
}

async function fetchSweets(query?: string): Promise<ItemDef[]> {
  await sleep(2200)

  return [
    {
      kind: 'item',
      id: 'sweet-soft-ice-cream',
      label: 'Soft Ice Cream',
      icon: '🍦',
    },
    {
      kind: 'item',
      id: 'sweet-ice-cream',
      label: 'Ice Cream',
      icon: '🍨',
    },
    {
      kind: 'item',
      id: 'sweet-shaved-ice',
      label: 'Shaved Ice',
      icon: '🍧',
    },
    {
      kind: 'item',
      id: 'sweet-shortcake',
      label: 'Shortcake',
      icon: '🍰',
    },
    {
      kind: 'item',
      id: 'sweet-birthday-cake',
      label: 'Birthday Cake',
      icon: '🎂',
    },
    {
      kind: 'item',
      id: 'sweet-cupcake',
      label: 'Cupcake',
      icon: '🧁',
    },
    {
      kind: 'item',
      id: 'sweet-pie',
      label: 'Pie',
      icon: '🥧',
    },
    {
      kind: 'item',
      id: 'sweet-custard',
      label: 'Custard',
      icon: '🍮',
    },
    {
      kind: 'item',
      id: 'sweet-chocolate',
      label: 'Chocolate Bar',
      icon: '🍫',
    },
    {
      kind: 'item',
      id: 'sweet-candy',
      label: 'Candy',
      icon: '🍬',
    },
    {
      kind: 'item',
      id: 'sweet-lollipop',
      label: 'Lollipop',
      icon: '🍭',
    },
    {
      kind: 'item',
      id: 'sweet-doughnut',
      label: 'Doughnut',
      icon: '🍩',
    },
    {
      kind: 'item',
      id: 'sweet-cookie',
      label: 'Cookie',
      icon: '🍪',
    },
  ].filter((item) =>
    item.label.toLowerCase().includes(query?.toLowerCase() ?? ''),
  ) as ItemDef[]
}

async function fetchSnacks(query?: string): Promise<ItemDef[]> {
  await sleep(900)

  return [
    {
      kind: 'item',
      id: 'snack-popcorn',
      label: 'Popcorn',
      icon: '🍿',
    },
    {
      kind: 'item',
      id: 'snack-pretzel',
      label: 'Pretzel',
      icon: '🥨',
    },
    {
      kind: 'item',
      id: 'snack-peanuts',
      label: 'Peanuts',
      icon: '🥜',
    },
    {
      kind: 'item',
      id: 'snack-chestnut',
      label: 'Chestnut',
      icon: '🌰',
    },
  ].filter((item) =>
    item.label.toLowerCase().includes(query?.toLowerCase() ?? ''),
  ) as ItemDef[]
}

async function fetchDairy(query?: string): Promise<ItemDef[]> {
  await sleep(1100)

  return [
    {
      kind: 'item',
      id: 'dairy-cheese',
      label: 'Cheese',
      icon: '🧀',
    },
    {
      kind: 'item',
      id: 'dairy-butter',
      label: 'Butter',
      icon: '🧈',
    },
    {
      kind: 'item',
      id: 'dairy-egg',
      label: 'Egg',
      icon: '🥚',
    },
    {
      kind: 'item',
      id: 'dairy-honey',
      label: 'Honey',
      icon: '🍯',
    },
    {
      kind: 'item',
      id: 'dairy-jar',
      label: 'Jar (Jam/Preserve)',
      icon: '🫙',
    },
  ].filter((item) =>
    item.label.toLowerCase().includes(query?.toLowerCase() ?? ''),
  ) as ItemDef[]
}

async function fetchCondiments(query?: string): Promise<ItemDef[]> {
  await sleep(1400)

  return [
    {
      kind: 'item',
      id: 'condiment-salt',
      label: 'Salt',
      icon: '🧂',
    },
    {
      kind: 'item',
      id: 'condiment-pouring-liquid',
      label: 'Pouring Liquid (Oil/Sauce)',
      icon: '🫗',
    },
    {
      kind: 'item',
      id: 'condiment-garlic',
      label: 'Garlic',
      icon: '🧄',
    },
    {
      kind: 'item',
      id: 'condiment-onion',
      label: 'Onion',
      icon: '🧅',
    },
    {
      kind: 'item',
      id: 'condiment-ginger',
      label: 'Ginger Root',
      icon: '🫚',
    },
    {
      kind: 'item',
      id: 'condiment-chili',
      label: 'Chili Pepper',
      icon: '🌶',
    },
    {
      kind: 'item',
      id: 'condiment-olive',
      label: 'Olive',
      icon: '🫒',
    },
  ].filter((item) =>
    item.label.toLowerCase().includes(query?.toLowerCase() ?? ''),
  ) as ItemDef[]
}

async function fetchDrinks(query?: string): Promise<ItemDef[]> {
  await sleep(2800)

  return [
    {
      kind: 'item',
      id: 'drink-hot-beverage',
      label: 'Hot Beverage',
      icon: '☕',
    },
    {
      kind: 'item',
      id: 'drink-teacup',
      label: 'Teacup Without Handle',
      icon: '🍵',
    },
    {
      kind: 'item',
      id: 'drink-teapot',
      label: 'Teapot',
      icon: '🫖',
    },
    {
      kind: 'item',
      id: 'drink-bubble-tea',
      label: 'Bubble Tea',
      icon: '🧋',
    },
    {
      kind: 'item',
      id: 'drink-beverage-box',
      label: 'Beverage Box',
      icon: '🧃',
    },
    {
      kind: 'item',
      id: 'drink-straw-cup',
      label: 'Cup with Straw',
      icon: '🥤',
    },
    {
      kind: 'item',
      id: 'drink-milk',
      label: 'Glass of Milk',
      icon: '🥛',
    },
    {
      kind: 'item',
      id: 'drink-baby-bottle',
      label: 'Baby Bottle',
      icon: '🍼',
    },
    {
      kind: 'item',
      id: 'drink-ice-cube',
      label: 'Ice',
      icon: '🧊',
    },
    {
      kind: 'item',
      id: 'drink-beer',
      label: 'Beer Mug',
      icon: '🍺',
    },
    {
      kind: 'item',
      id: 'drink-beers',
      label: 'Clinking Beer Mugs',
      icon: '🍻',
    },
    {
      kind: 'item',
      id: 'drink-wine',
      label: 'Wine Glass',
      icon: '🍷',
    },
    {
      kind: 'item',
      id: 'drink-tumbler',
      label: 'Tumbler Glass',
      icon: '🥃',
    },
    {
      kind: 'item',
      id: 'drink-cocktail',
      label: 'Cocktail',
      icon: '🍸',
    },
    {
      kind: 'item',
      id: 'drink-tropical',
      label: 'Tropical Drink',
      icon: '🍹',
    },
    {
      kind: 'item',
      id: 'drink-sake',
      label: 'Sake',
      icon: '🍶',
    },
    {
      kind: 'item',
      id: 'drink-champagne',
      label: 'Bottle with Popping Cork',
      icon: '🍾',
    },
    {
      kind: 'item',
      id: 'drink-mate',
      label: 'Mate',
      icon: '🧉',
    },
  ].filter((item) =>
    item.label.toLowerCase().includes(query?.toLowerCase() ?? ''),
  ) as ItemDef[]
}
