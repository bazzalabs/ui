/** biome-ignore-all lint/correctness/noNestedComponentDefinitions: <explanation> */

'use client'

import type { GroupNode, ItemNode, MenuData } from '@bazza-ui/action-menu'
import { ListXIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { ActionMenu } from '@/registry/action-menu'

function getMenuItems(menu: MenuData<any>): ItemNode[] {
  const items =
    menu.nodes?.filter((node) => !node.hidden && node.kind === 'item') ?? []
  const groups = (menu.nodes?.filter(
    (node) => !node.hidden && node.kind === 'group',
  ) ?? []) as GroupNode[]
  const groupItems = groups?.flatMap((group) =>
    group.nodes.filter((n) => n.kind === 'item'),
  )

  return [...items, ...groupItems] as ItemNode[]
}

export function ActionMenu_Header() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  function deselectAll() {
    setSelectedItems([])
  }

  return (
    <ActionMenu.Root defaultOpen modal={false}>
      <ActionMenu.Trigger asChild>
        <Button variant="secondary">Trigger</Button>
      </ActionMenu.Trigger>
      <ActionMenu.Positioner align="center">
        <ActionMenu.Content
          slots={{
            Header: ({ menu }) => {
              return (
                <div className="px-4 py-1.5 dark:bg-neutral-800 bg-neutral-200/75 rounded-t-lg rounded-b-xl text-xs border-b shadow-xs flex items-center justify-between select-none">
                  {menu.title}
                  <span className="text-muted-foreground">
                    {getMenuItems(menu).length} items
                  </span>
                </div>
              )
            },
            Footer: () => {
              if (selectedItems.length === 0) return null
              return (
                <div className="p-1 rounded-b-lg border-t">
                  <button
                    type="button"
                    onClick={deselectAll}
                    className={cn(
                      'group flex items-center gap-2 rounded-md px-3 py-1.5 text-sm select-none justify-between w-full',
                      'hover:bg-accent',
                    )}
                  >
                    <span>Clear selection</span>
                    <ListXIcon className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </button>
                </div>
              )
            },
            Item: ({ node, bind }) => {
              const props = bind.getRowProps({
                className: 'flex items-center gap-2',
              })

              return (
                <div {...props}>
                  <Checkbox
                    className="border-muted group-data-[focused=true]:border-muted-foreground/25"
                    checked={selectedItems.includes(node.id)}
                  />
                  <span>{node.icon as string}</span>
                  <span>{node.label}</span>
                </div>
              )
            },
          }}
          menu={{
            id: 'root',
            title: 'Fruits',
            defaults: {
              item: {
                onSelect: ({ node }) => {
                  const checked = selectedItems.includes(node.id)
                  setSelectedItems((prev) => {
                    return checked
                      ? prev.filter((id) => id !== node.id)
                      : prev.concat(node.id)
                  })
                },
              },
            },
            nodes: [
              {
                kind: 'group',
                id: 'fruits',
                heading: 'Fruits',
                nodes: [
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
                  { kind: 'item', id: 'fruit-pear', label: 'Pear', icon: '🍐' },
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
                  { kind: 'item', id: 'fruit-kiwi', label: 'Kiwi', icon: '🥝' },
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
                ],
              },
              {
                kind: 'group',
                id: 'vegetables',
                heading: 'Vegetables',
                nodes: [
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
                  { kind: 'item', id: 'veg-onion', label: 'Onion', icon: '🧅' },
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
                  { kind: 'item', id: 'veg-beans', label: 'Beans', icon: '🫘' },
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
                ],
              },
              {
                kind: 'group',
                id: 'meats-protein',
                heading: 'Meats & Protein',
                nodes: [
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
                  { kind: 'item', id: 'protein-egg', label: 'Egg', icon: '🥚' },
                  {
                    kind: 'item',
                    id: 'protein-fried-egg',
                    label: 'Fried Egg',
                    icon: '🍳',
                  },
                ],
              },
              {
                kind: 'group',
                id: 'seafood',
                heading: 'Seafood',
                nodes: [
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
                ],
              },
              {
                kind: 'group',
                id: 'bakery-grains',
                heading: 'Bakery & Grains',
                nodes: [
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
                ],
              },
              {
                kind: 'group',
                id: 'meals-prepared',
                heading: 'Meals & Prepared',
                nodes: [
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
                  { kind: 'item', id: 'meal-taco', label: 'Taco', icon: '🌮' },
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
                  { kind: 'item', id: 'meal-oden', label: 'Oden', icon: '🍢' },
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
                ],
              },
              {
                kind: 'group',
                id: 'sweets-desserts',
                heading: 'Sweets & Desserts',
                nodes: [
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
                  { kind: 'item', id: 'sweet-pie', label: 'Pie', icon: '🥧' },
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
                ],
              },
              {
                kind: 'group',
                id: 'snacks-nuts',
                heading: 'Snacks & Nuts',
                nodes: [
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
                ],
              },
              {
                kind: 'group',
                id: 'dairy-eggs',
                heading: 'Dairy & Eggs',
                nodes: [
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
                  { kind: 'item', id: 'dairy-egg', label: 'Egg', icon: '🥚' },
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
                ],
              },
              {
                kind: 'group',
                id: 'condiments-staples',
                heading: 'Condiments & Staples',
                nodes: [
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
                ],
              },
              {
                kind: 'group',
                id: 'drinks',
                heading: 'Drinks',
                nodes: [
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
                  { kind: 'item', id: 'drink-sake', label: 'Sake', icon: '🍶' },
                  {
                    kind: 'item',
                    id: 'drink-champagne',
                    label: 'Bottle with Popping Cork',
                    icon: '🍾',
                  },
                  { kind: 'item', id: 'drink-mate', label: 'Mate', icon: '🧉' },
                ],
              },
            ],
          }}
        />
      </ActionMenu.Positioner>
    </ActionMenu.Root>
  )
}
