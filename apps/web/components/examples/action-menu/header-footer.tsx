/** biome-ignore-all lint/correctness/noNestedComponentDefinitions: no need */

'use client'

import type { GroupDef, ItemDef, Menu } from '@bazza-ui/action-menu'
import { ListXIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ActionMenu } from '@/registry/action-menu'

function getMenuItems(menu: Menu): ItemDef[] {
  const items =
    menu.nodes?.filter((node) => !node.hidden && node.kind === 'item') ?? []
  const groups = (menu.nodes?.filter(
    (node) => !node.hidden && node.kind === 'group',
  ) ?? []) as GroupDef[]
  const groupItems = groups?.flatMap((group) =>
    group.nodes.filter((n) => n.kind === 'item'),
  )

  return [...items, ...groupItems] as ItemDef[]
}

export function ActionMenu_HeaderFooter() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  function deselectAll() {
    setSelectedItems([])
  }

  function makeCheckboxItem(id: string, label: string, icon: string): ItemDef {
    return {
      kind: 'item',
      variant: 'checkbox',
      id,
      label,
      icon,
      checked: selectedItems.includes(id),
      onCheckedChange: () => {
        setSelectedItems((prev) =>
          prev.includes(id) ? prev.filter((i) => i !== id) : prev.concat(id),
        )
      },
    }
  }

  return (
    <ActionMenu
      trigger={<Button variant="secondary">Trigger</Button>}
      menu={{
        id: 'root',
        title: 'Fruits',
        ui: {
          slots: {
            Header: ({ menu }) => {
              return (
                <div className="px-4 py-1.5 dark:bg-neutral-800 bg-neutral-200/75 rounded-t-lg rounded-b-xl text-xs border-b shadow-xs flex items-center justify-between select-none mb-1">
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
          },
        },
        nodes: [
          {
            kind: 'group',
            id: 'fruits',
            heading: 'Fruits',
            nodes: [
              makeCheckboxItem('fruit-apple-red', 'Apple', '🍎'),
              makeCheckboxItem('fruit-apple-green', 'Green Apple', '🍏'),
              makeCheckboxItem('fruit-pear', 'Pear', '🍐'),
              makeCheckboxItem('fruit-tangerine', 'Tangerine', '🍊'),
              makeCheckboxItem('fruit-lemon', 'Lemon', '🍋'),
              makeCheckboxItem('fruit-banana', 'Banana', '🍌'),
              makeCheckboxItem('fruit-watermelon', 'Watermelon', '🍉'),
              makeCheckboxItem('fruit-grapes', 'Grapes', '🍇'),
              makeCheckboxItem('fruit-strawberry', 'Strawberry', '🍓'),
              makeCheckboxItem('fruit-blueberries', 'Blueberries', '🫐'),
              makeCheckboxItem('fruit-cherries', 'Cherries', '🍒'),
              makeCheckboxItem('fruit-peach', 'Peach', '🍑'),
              makeCheckboxItem('fruit-mango', 'Mango', '🥭'),
              makeCheckboxItem('fruit-pineapple', 'Pineapple', '🍍'),
              makeCheckboxItem('fruit-coconut', 'Coconut', '🥥'),
              makeCheckboxItem('fruit-kiwi', 'Kiwi', '🥝'),
              makeCheckboxItem('fruit-melon', 'Melon', '🍈'),
              makeCheckboxItem('fruit-tomato', 'Tomato', '🍅'),
              makeCheckboxItem('fruit-olive', 'Olive', '🫒'),
            ],
          },
          {
            kind: 'group',
            id: 'vegetables',
            heading: 'Vegetables',
            nodes: [
              makeCheckboxItem('veg-eggplant', 'Eggplant', '🍆'),
              makeCheckboxItem('veg-avocado', 'Avocado', '🥑'),
              makeCheckboxItem('veg-broccoli', 'Broccoli', '🥦'),
              makeCheckboxItem('veg-leafy-green', 'Leafy Green', '🥬'),
              makeCheckboxItem('veg-cucumber', 'Cucumber', '🥒'),
              makeCheckboxItem('veg-hot-pepper', 'Hot Pepper', '🌶'),
              makeCheckboxItem('veg-bell-pepper', 'Bell Pepper', '🫑'),
              makeCheckboxItem('veg-garlic', 'Garlic', '🧄'),
              makeCheckboxItem('veg-onion', 'Onion', '🧅'),
              makeCheckboxItem('veg-carrot', 'Carrot', '🥕'),
              makeCheckboxItem('veg-corn', 'Ear of Corn', '🌽'),
              makeCheckboxItem('veg-potato', 'Potato', '🥔'),
              makeCheckboxItem('veg-mushroom', 'Mushroom', '🍄'),
              makeCheckboxItem(
                'veg-sweet-potato',
                'Roasted Sweet Potato',
                '🍠',
              ),
              makeCheckboxItem('veg-beans', 'Beans', '🫘'),
              makeCheckboxItem('veg-peas', 'Pea Pod', '🫛'),
              makeCheckboxItem('veg-ginger', 'Ginger Root', '🫚'),
            ],
          },
          {
            kind: 'group',
            id: 'meats-protein',
            heading: 'Meats & Protein',
            nodes: [
              makeCheckboxItem('protein-bacon', 'Bacon', '🥓'),
              makeCheckboxItem('protein-cut-of-meat', 'Cut of Meat', '🥩'),
              makeCheckboxItem('protein-poultry-leg', 'Poultry Leg', '🍗'),
              makeCheckboxItem('protein-meat-on-bone', 'Meat on Bone', '🍖'),
              makeCheckboxItem('protein-egg', 'Egg', '🥚'),
              makeCheckboxItem('protein-fried-egg', 'Fried Egg', '🍳'),
            ],
          },
          {
            kind: 'group',
            id: 'seafood',
            heading: 'Seafood',
            nodes: [
              makeCheckboxItem('seafood-fish', 'Fish', '🐟'),
              makeCheckboxItem('seafood-tropical-fish', 'Tropical Fish', '🐠'),
              makeCheckboxItem('seafood-shrimp', 'Shrimp', '🦐'),
              makeCheckboxItem('seafood-lobster', 'Lobster', '🦞'),
              makeCheckboxItem('seafood-crab', 'Crab', '🦀'),
              makeCheckboxItem('seafood-squid', 'Squid', '🦑'),
              makeCheckboxItem('seafood-oyster', 'Oyster', '🦪'),
              makeCheckboxItem('seafood-octopus', 'Octopus', '🐙'),
            ],
          },
          {
            kind: 'group',
            id: 'bakery-grains',
            heading: 'Bakery & Grains',
            nodes: [
              makeCheckboxItem('bakery-bread', 'Bread', '🍞'),
              makeCheckboxItem('bakery-croissant', 'Croissant', '🥐'),
              makeCheckboxItem('bakery-baguette', 'Baguette', '🥖'),
              makeCheckboxItem('bakery-flatbread', 'Flatbread', '🫓'),
              makeCheckboxItem('bakery-bagel', 'Bagel', '🥯'),
              makeCheckboxItem('bakery-pancakes', 'Pancakes', '🥞'),
              makeCheckboxItem('bakery-waffle', 'Waffle', '🧇'),
            ],
          },
          {
            kind: 'group',
            id: 'meals-prepared',
            heading: 'Meals & Prepared',
            nodes: [
              makeCheckboxItem('meal-hamburger', 'Hamburger', '🍔'),
              makeCheckboxItem('meal-hot-dog', 'Hot Dog', '🌭'),
              makeCheckboxItem('meal-fries', 'French Fries', '🍟'),
              makeCheckboxItem('meal-pizza', 'Pizza', '🍕'),
              makeCheckboxItem('meal-sandwich', 'Sandwich', '🥪'),
              makeCheckboxItem(
                'meal-stuffed-flatbread',
                'Stuffed Flatbread',
                '🥙',
              ),
              makeCheckboxItem('meal-taco', 'Taco', '🌮'),
              makeCheckboxItem('meal-burrito', 'Burrito', '🌯'),
              makeCheckboxItem('meal-green-salad', 'Green Salad', '🥗'),
              makeCheckboxItem('meal-shallow-pan', 'Shallow Pan of Food', '🥘'),
              makeCheckboxItem('meal-pot-of-food', 'Pot of Food', '🍲'),
              makeCheckboxItem('meal-curry-rice', 'Curry Rice', '🍛'),
              makeCheckboxItem('meal-spaghetti', 'Spaghetti', '🍝'),
              makeCheckboxItem(
                'meal-steaming-bowl',
                'Steaming Bowl (Ramen)',
                '🍜',
              ),
              makeCheckboxItem('meal-sushi', 'Sushi', '🍣'),
              makeCheckboxItem('meal-bento', 'Bento Box', '🍱'),
              makeCheckboxItem('meal-fried-shrimp', 'Fried Shrimp', '🍤'),
              makeCheckboxItem('meal-oden', 'Oden', '🍢'),
              makeCheckboxItem('meal-fish-cake', 'Fish Cake with Swirl', '🍥'),
              makeCheckboxItem('meal-dumpling', 'Dumpling', '🥟'),
              makeCheckboxItem('meal-fortune-cookie', 'Fortune Cookie', '🥠'),
              makeCheckboxItem('meal-takeout', 'Takeout Box', '🥡'),
              makeCheckboxItem('meal-tamale', 'Tamale', '🫔'),
              makeCheckboxItem('meal-fondue', 'Fondue', '🫕'),
              makeCheckboxItem('meal-falafel', 'Falafel', '🧆'),
              makeCheckboxItem('meal-bowl-with-spoon', 'Bowl with Spoon', '🥣'),
            ],
          },
          {
            kind: 'group',
            id: 'sweets-desserts',
            heading: 'Sweets & Desserts',
            nodes: [
              makeCheckboxItem('sweet-soft-ice-cream', 'Soft Ice Cream', '🍦'),
              makeCheckboxItem('sweet-ice-cream', 'Ice Cream', '🍨'),
              makeCheckboxItem('sweet-shaved-ice', 'Shaved Ice', '🍧'),
              makeCheckboxItem('sweet-shortcake', 'Shortcake', '🍰'),
              makeCheckboxItem('sweet-birthday-cake', 'Birthday Cake', '🎂'),
              makeCheckboxItem('sweet-cupcake', 'Cupcake', '🧁'),
              makeCheckboxItem('sweet-pie', 'Pie', '🥧'),
              makeCheckboxItem('sweet-custard', 'Custard', '🍮'),
              makeCheckboxItem('sweet-chocolate', 'Chocolate Bar', '🍫'),
              makeCheckboxItem('sweet-candy', 'Candy', '🍬'),
              makeCheckboxItem('sweet-lollipop', 'Lollipop', '🍭'),
              makeCheckboxItem('sweet-doughnut', 'Doughnut', '🍩'),
              makeCheckboxItem('sweet-cookie', 'Cookie', '🍪'),
            ],
          },
          {
            kind: 'group',
            id: 'snacks-nuts',
            heading: 'Snacks & Nuts',
            nodes: [
              makeCheckboxItem('snack-popcorn', 'Popcorn', '🍿'),
              makeCheckboxItem('snack-pretzel', 'Pretzel', '🥨'),
              makeCheckboxItem('snack-peanuts', 'Peanuts', '🥜'),
              makeCheckboxItem('snack-chestnut', 'Chestnut', '🌰'),
            ],
          },
          {
            kind: 'group',
            id: 'dairy-eggs',
            heading: 'Dairy & Eggs',
            nodes: [
              makeCheckboxItem('dairy-cheese', 'Cheese', '🧀'),
              makeCheckboxItem('dairy-butter', 'Butter', '🧈'),
              makeCheckboxItem('dairy-egg', 'Egg', '🥚'),
              makeCheckboxItem('dairy-honey', 'Honey', '🍯'),
              makeCheckboxItem('dairy-jar', 'Jar (Jam/Preserve)', '🫙'),
            ],
          },
          {
            kind: 'group',
            id: 'condiments-staples',
            heading: 'Condiments & Staples',
            nodes: [
              makeCheckboxItem('condiment-salt', 'Salt', '🧂'),
              makeCheckboxItem(
                'condiment-pouring-liquid',
                'Pouring Liquid (Oil/Sauce)',
                '🫗',
              ),
              makeCheckboxItem('condiment-garlic', 'Garlic', '🧄'),
              makeCheckboxItem('condiment-onion', 'Onion', '🧅'),
              makeCheckboxItem('condiment-ginger', 'Ginger Root', '🫚'),
              makeCheckboxItem('condiment-chili', 'Chili Pepper', '🌶'),
              makeCheckboxItem('condiment-olive', 'Olive', '🫒'),
            ],
          },
          {
            kind: 'group',
            id: 'drinks',
            heading: 'Drinks',
            nodes: [
              makeCheckboxItem('drink-hot-beverage', 'Hot Beverage', '☕'),
              makeCheckboxItem('drink-teacup', 'Teacup Without Handle', '🍵'),
              makeCheckboxItem('drink-teapot', 'Teapot', '🫖'),
              makeCheckboxItem('drink-bubble-tea', 'Bubble Tea', '🧋'),
              makeCheckboxItem('drink-beverage-box', 'Beverage Box', '🧃'),
              makeCheckboxItem('drink-straw-cup', 'Cup with Straw', '🥤'),
              makeCheckboxItem('drink-milk', 'Glass of Milk', '🥛'),
              makeCheckboxItem('drink-baby-bottle', 'Baby Bottle', '🍼'),
              makeCheckboxItem('drink-ice-cube', 'Ice', '🧊'),
              makeCheckboxItem('drink-beer', 'Beer Mug', '🍺'),
              makeCheckboxItem('drink-beers', 'Clinking Beer Mugs', '🍻'),
              makeCheckboxItem('drink-wine', 'Wine Glass', '🍷'),
              makeCheckboxItem('drink-tumbler', 'Tumbler Glass', '🥃'),
              makeCheckboxItem('drink-cocktail', 'Cocktail', '🍸'),
              makeCheckboxItem('drink-tropical', 'Tropical Drink', '🍹'),
              makeCheckboxItem('drink-sake', 'Sake', '🍶'),
              makeCheckboxItem(
                'drink-champagne',
                'Bottle with Popping Cork',
                '🍾',
              ),
              makeCheckboxItem('drink-mate', 'Mate', '🧉'),
            ],
          },
        ],
      }}
    />
  )
}
