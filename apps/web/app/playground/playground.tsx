'use client'

import { DropdownMenu } from '@bazza-ui/react'
import * as React from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function Playground() {
  return (
    <div className="grid grid-cols-3 gap-8 p-8">
      <BasicExample />
      <SearchableExample />
      <GroupedExample />
      <ControlledExample />
      <SubmenuExample />
      <RadioGroupExample />
      <ArrowBackdropExample />
    </div>
  )
}

/**
 * Basic dropdown menu without search
 */
function BasicExample() {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-gray-500">Basic</span>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800">
          Basic Menu
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg">
              <DropdownMenu.Surface>
                <DropdownMenu.Input
                  hideUntilActive
                  placeholder="Search..."
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  render={(props, state) => (
                    <div
                      className={cn(
                        'border-b border-gray-200 p-2',
                        state.active ? '' : 'hidden',
                      )}
                    >
                      <input {...props} />
                    </div>
                  )}
                />
                <DropdownMenu.List className="focus:outline-none p-1">
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                    onSelect={() => console.log('Profile clicked')}
                  >
                    Profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                    onSelect={() => console.log('Settings clicked')}
                  >
                    Settings
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                    onSelect={() => toast('Settings clicked')}
                    closeOnClick={false}
                  >
                    Settings, but stay open
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 data-[highlighted]:bg-red-50"
                    onSelect={() => console.log('Sign out clicked')}
                  >
                    Sign out
                  </DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

/**
 * Searchable dropdown menu with fuzzy filtering
 */
function SearchableExample() {
  const fruits = [
    { value: 'apple', label: 'Apple', keywords: ['fruit', 'red', 'green'] },
    { value: 'banana', label: 'Banana', keywords: ['fruit', 'yellow'] },
    { value: 'cherry', label: 'Cherry', keywords: ['fruit', 'red'] },
    {
      value: 'dragonfruit',
      label: 'Dragon Fruit',
      keywords: ['fruit', 'exotic', 'pink'],
    },
    {
      value: 'elderberry',
      label: 'Elderberry',
      keywords: ['fruit', 'berry', 'purple'],
    },
    { value: 'fig', label: 'Fig', keywords: ['fruit', 'mediterranean'] },
    {
      value: 'grape',
      label: 'Grape',
      keywords: ['fruit', 'purple', 'green', 'wine'],
    },
    {
      value: 'honeydew',
      label: 'Honeydew',
      keywords: ['fruit', 'melon', 'green'],
    },
  ]

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-gray-500">Searchable</span>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500">
          Select Fruit
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[220px] rounded-lg border border-gray-200 bg-white shadow-lg">
              <DropdownMenu.Surface loop autoHighlightFirst clearSearchOnClose>
                <div className="border-b border-gray-200 p-2">
                  <DropdownMenu.Input
                    placeholder="Search fruits..."
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <DropdownMenu.List className="max-h-[200px] overflow-y-auto scroll-py-1 p-1">
                  {({ search, filteredCount }) => (
                    <>
                      {search && (
                        <div className="px-3 py-1 text-xs text-gray-400">
                          {filteredCount} result{filteredCount !== 1 ? 's' : ''}
                        </div>
                      )}
                      {fruits.map((fruit) => (
                        <DropdownMenu.Item
                          key={fruit.value}
                          value={fruit.value}
                          keywords={fruit.keywords}
                          className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                          onSelect={() =>
                            console.log(`Selected: ${fruit.label}`)
                          }
                        >
                          {fruit.label}
                        </DropdownMenu.Item>
                      ))}
                    </>
                  )}
                </DropdownMenu.List>
                <DropdownMenu.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                  No fruits found
                </DropdownMenu.Empty>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

/**
 * Grouped dropdown menu with search
 */
function GroupedExample() {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-gray-500">Grouped</span>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500">
          Actions
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[240px] rounded-lg border border-gray-200 bg-white shadow-lg">
              <DropdownMenu.Surface loop autoHighlightFirst>
                <div className="border-b border-gray-200 p-2">
                  <DropdownMenu.Input
                    placeholder="Search actions..."
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <DropdownMenu.List className="max-h-[300px] overflow-y-auto scroll-py-1 p-1">
                  {/* Edit Group */}
                  <DropdownMenu.Group>
                    <DropdownMenu.GroupLabel className="px-3 py-1.5 text-xs font-semibold text-gray-500">
                      Edit
                    </DropdownMenu.GroupLabel>
                    <DropdownMenu.Item
                      value="undo"
                      keywords={['revert', 'back']}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-emerald-50"
                      onSelect={() => console.log('Undo')}
                    >
                      Undo
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      value="redo"
                      keywords={['forward']}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-emerald-50"
                      onSelect={() => console.log('Redo')}
                    >
                      Redo
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      value="cut"
                      keywords={['remove', 'move']}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-emerald-50"
                      onSelect={() => console.log('Cut')}
                    >
                      Cut
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      value="copy"
                      keywords={['duplicate', 'clipboard']}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-emerald-50"
                      onSelect={() => console.log('Copy')}
                    >
                      Copy
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      value="paste"
                      keywords={['insert', 'clipboard']}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-emerald-50"
                      onSelect={() => console.log('Paste')}
                    >
                      Paste
                    </DropdownMenu.Item>
                  </DropdownMenu.Group>

                  <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

                  {/* View Group */}
                  <DropdownMenu.Group>
                    <DropdownMenu.GroupLabel className="px-3 py-1.5 text-xs font-semibold text-gray-500">
                      View
                    </DropdownMenu.GroupLabel>
                    <DropdownMenu.Item
                      value="zoom-in"
                      keywords={['magnify', 'larger', 'bigger']}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-emerald-50"
                      onSelect={() => console.log('Zoom In')}
                    >
                      Zoom In
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      value="zoom-out"
                      keywords={['smaller', 'shrink']}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-emerald-50"
                      onSelect={() => console.log('Zoom Out')}
                    >
                      Zoom Out
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      value="fullscreen"
                      keywords={['maximize', 'expand']}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-emerald-50"
                      onSelect={() => console.log('Fullscreen')}
                    >
                      Fullscreen
                    </DropdownMenu.Item>
                  </DropdownMenu.Group>

                  <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

                  {/* Danger Zone */}
                  <DropdownMenu.Group>
                    <DropdownMenu.GroupLabel className="px-3 py-1.5 text-xs font-semibold text-red-500">
                      Danger Zone
                    </DropdownMenu.GroupLabel>
                    <DropdownMenu.Item
                      value="delete"
                      keywords={['remove', 'trash', 'destroy']}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 data-[highlighted]:bg-red-50"
                      onSelect={() => console.log('Delete')}
                    >
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Group>
                </DropdownMenu.List>
                <DropdownMenu.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                  No actions found
                </DropdownMenu.Empty>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

/**
 * Controlled dropdown with external state
 */
function ControlledExample() {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [selected, setSelected] = React.useState<string | null>(null)

  const countries = [
    { value: 'us', label: 'United States', flag: '🇺🇸' },
    { value: 'uk', label: 'United Kingdom', flag: '🇬🇧' },
    { value: 'ca', label: 'Canada', flag: '🇨🇦' },
    { value: 'au', label: 'Australia', flag: '🇦🇺' },
    { value: 'de', label: 'Germany', flag: '🇩🇪' },
    { value: 'fr', label: 'France', flag: '🇫🇷' },
    { value: 'jp', label: 'Japan', flag: '🇯🇵' },
    { value: 'br', label: 'Brazil', flag: '🇧🇷' },
  ]

  const selectedCountry = countries.find((c) => c.value === selected)

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-gray-500">Controlled</span>
      <div className="text-xs text-gray-400">
        Search: "{search}" | Selected: {selected || 'none'}
      </div>
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-500">
          {selectedCountry ? (
            <>
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.label}</span>
            </>
          ) : (
            'Select Country'
          )}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[220px] rounded-lg border border-gray-200 bg-white shadow-lg">
              <DropdownMenu.Surface
                search={search}
                onSearchChange={setSearch}
                loop
                autoHighlightFirst
                clearSearchOnClose
              >
                <div className="border-b border-gray-200 p-2">
                  <DropdownMenu.Input
                    placeholder="Search countries..."
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <DropdownMenu.List className="max-h-[200px] overflow-y-auto scroll-py-1 p-1">
                  {countries.map((country) => (
                    <DropdownMenu.Item
                      key={country.value}
                      value={country.label}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[highlighted]:bg-purple-50"
                      onSelect={() => {
                        setSelected(country.value)
                        setOpen(false)
                      }}
                    >
                      <span>{country.flag}</span>
                      <span>{country.label}</span>
                      {selected === country.value && (
                        <span className="ml-auto text-purple-600">✓</span>
                      )}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.List>
                <DropdownMenu.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                  No countries found
                </DropdownMenu.Empty>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

/**
 * Dropdown menu with submenus
 */
function SubmenuExample() {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-gray-500">Submenu</span>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-500">
          With Submenu
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg">
              <DropdownMenu.Surface>
                <DropdownMenu.Input
                  hideUntilActive
                  placeholder="Search..."
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  render={(props, state) => (
                    <div
                      className={cn(
                        'border-b border-gray-200 p-2',
                        state.active ? '' : 'hidden',
                      )}
                    >
                      <input {...props} />
                    </div>
                  )}
                />
                <DropdownMenu.List className="focus:outline-none p-1">
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                    onSelect={() => toast('New File')}
                  >
                    New File
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                    onSelect={() => toast('Open')}
                  >
                    Open
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

                  {/* Share Submenu */}
                  <DropdownMenu.Submenu>
                    <DropdownMenu.SubmenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100">
                      <span>Share</span>
                      <DropdownMenu.SubmenuTriggerIndicator className="text-muted-foreground/75 data-[popup-open]:not-data-[popup-focused]:text-foreground/75 data-[popup-focused]:text-foreground transition-[color] duration-50 ease-out shrink-0 size-4">
                        <CaretRightIcon className="size-full" />
                      </DropdownMenu.SubmenuTriggerIndicator>
                    </DropdownMenu.SubmenuTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Positioner sideOffset={4}>
                        <DropdownMenu.Popup className="min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg">
                          <DropdownMenu.Surface>
                            <div className="border-b border-gray-200 p-2">
                              <DropdownMenu.Input
                                placeholder="Search..."
                                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                              />
                            </div>
                            <DropdownMenu.List className="p-1 focus:outline-none">
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                onSelect={() => toast('Share via Email')}
                              >
                                Email
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                onSelect={() => toast('Share via Slack')}
                              >
                                Slack
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                onSelect={() => toast('Copy Link')}
                              >
                                Copy Link
                              </DropdownMenu.Item>

                              {/* Nested Submenu */}
                              <DropdownMenu.Submenu>
                                <DropdownMenu.SubmenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100">
                                  <span>Social Media</span>
                                  <DropdownMenu.SubmenuTriggerIndicator className="text-muted-foreground/75 data-[popup-open]:not-data-[popup-focused]:text-foreground/75 data-[popup-focused]:text-foreground transition-[color] duration-50 ease-out shrink-0 size-4">
                                    <CaretRightIcon className="size-full" />
                                  </DropdownMenu.SubmenuTriggerIndicator>
                                </DropdownMenu.SubmenuTrigger>
                                <DropdownMenu.Portal>
                                  <DropdownMenu.Positioner sideOffset={4}>
                                    <DropdownMenu.Popup className="min-w-[160px] rounded-lg border border-gray-200 bg-white shadow-lg">
                                      <DropdownMenu.Surface>
                                        <div className="border-b border-gray-200 p-2">
                                          <DropdownMenu.Input
                                            placeholder="Search..."
                                            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                          />
                                        </div>
                                        <DropdownMenu.List className="p-1 focus:outline-none">
                                          <DropdownMenu.Item
                                            className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                            onSelect={() =>
                                              toast('Share on Twitter')
                                            }
                                          >
                                            Twitter
                                          </DropdownMenu.Item>
                                          <DropdownMenu.Item
                                            className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                            onSelect={() =>
                                              toast('Share on Facebook')
                                            }
                                          >
                                            Facebook
                                          </DropdownMenu.Item>
                                          <DropdownMenu.Item
                                            className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                            onSelect={() =>
                                              toast('Share on LinkedIn')
                                            }
                                          >
                                            LinkedIn
                                          </DropdownMenu.Item>
                                        </DropdownMenu.List>
                                      </DropdownMenu.Surface>
                                    </DropdownMenu.Popup>
                                  </DropdownMenu.Positioner>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Submenu>
                            </DropdownMenu.List>
                          </DropdownMenu.Surface>
                        </DropdownMenu.Popup>
                      </DropdownMenu.Positioner>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Submenu>

                  {/* Export Submenu */}
                  <DropdownMenu.Submenu>
                    <DropdownMenu.SubmenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100">
                      <span>Export as</span>
                      <DropdownMenu.SubmenuTriggerIndicator className="text-muted-foreground/75 data-[popup-open]:not-data-[popup-focused]:text-foreground/75 data-[popup-focused]:text-foreground transition-[color] duration-50 ease-out shrink-0 size-4">
                        <CaretRightIcon className="size-full" />
                      </DropdownMenu.SubmenuTriggerIndicator>
                    </DropdownMenu.SubmenuTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Positioner sideOffset={4}>
                        <DropdownMenu.Popup className="min-w-[160px] rounded-lg border border-gray-200 bg-white shadow-lg">
                          <DropdownMenu.Surface>
                            <div className="border-b border-gray-200 p-2">
                              <DropdownMenu.Input
                                placeholder="Search..."
                                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                              />
                            </div>
                            <DropdownMenu.List className="p-1 focus:outline-none">
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                onSelect={() => toast('Export as PDF')}
                              >
                                PDF
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                onSelect={() => toast('Export as PNG')}
                              >
                                PNG
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                onSelect={() => toast('Export as SVG')}
                              >
                                SVG
                              </DropdownMenu.Item>
                            </DropdownMenu.List>
                          </DropdownMenu.Surface>
                        </DropdownMenu.Popup>
                      </DropdownMenu.Positioner>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Submenu>

                  <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 data-[highlighted]:bg-red-50"
                    onSelect={() => toast('Deleted!')}
                  >
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

/**
 * RadioGroup example with sort options
 */
function RadioGroupExample() {
  const [sort, setSort] = React.useState<'name' | 'date' | 'size'>('name')

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-gray-500">RadioGroup</span>
      <div className="text-xs text-gray-400">Sort: {sort}</div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500">
          Sort by: {sort}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg">
              <DropdownMenu.Surface>
                <DropdownMenu.List className="p-1 focus:outline-none">
                  <DropdownMenu.RadioGroup value={sort} onValueChange={setSort}>
                    <DropdownMenu.RadioItem
                      value="name"
                      className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-indigo-50"
                    >
                      <span>Name</span>
                      <DropdownMenu.RadioItemIndicator className="flex h-4 w-4 items-center justify-center">
                        <CheckIcon className="h-4 w-4 text-indigo-600" />
                      </DropdownMenu.RadioItemIndicator>
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem
                      value="date"
                      className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-indigo-50"
                    >
                      <span>Date</span>
                      <DropdownMenu.RadioItemIndicator className="flex h-4 w-4 items-center justify-center">
                        <CheckIcon className="h-4 w-4 text-indigo-600" />
                      </DropdownMenu.RadioItemIndicator>
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem
                      value="size"
                      className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-indigo-50"
                    >
                      <span>Size</span>
                      <DropdownMenu.RadioItemIndicator className="flex h-4 w-4 items-center justify-center">
                        <CheckIcon className="h-4 w-4 text-indigo-600" />
                      </DropdownMenu.RadioItemIndicator>
                    </DropdownMenu.RadioItem>
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

const CheckIcon = ({ ...props }: React.HTMLAttributes<SVGSVGElement>) => {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}

const CaretRightIcon = ({ ...props }: React.HTMLAttributes<SVGSVGElement>) => {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M6 11L6 4L10.5 7.5L6 11Z" fill="currentColor" />
    </svg>
  )
}

/**
 * Arrow and Backdrop example with nested submenus
 */
function ArrowBackdropExample() {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-gray-500">Arrow & Backdrop</span>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="rounded-md bg-rose-600 px-4 py-2 text-white hover:bg-rose-500">
          With Arrow & Backdrop
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Backdrop className="fixed inset-0 bg-black/20 pointer-events-none" />
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="relative min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg">
              <DropdownMenu.Arrow className="data-[side=bottom]:top-[-8px] data-[side=top]:bottom-[-8px] data-[side=left]:right-[-8px] data-[side=right]:left-[-8px]">
                <ArrowSvg />
              </DropdownMenu.Arrow>
              <DropdownMenu.Surface>
                <DropdownMenu.List className="p-1 focus:outline-none">
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                    onSelect={() => toast('Profile')}
                  >
                    Profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                    onSelect={() => toast('Settings')}
                  >
                    Settings
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

                  {/* First Submenu */}
                  <DropdownMenu.Submenu>
                    <DropdownMenu.SubmenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100">
                      <span>More Options</span>
                      <DropdownMenu.SubmenuTriggerIndicator className="text-muted-foreground/75 shrink-0 size-4">
                        <CaretRightIcon className="size-full" />
                      </DropdownMenu.SubmenuTriggerIndicator>
                    </DropdownMenu.SubmenuTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Backdrop className="fixed inset-0 bg-black/10 pointer-events-none" />
                      <DropdownMenu.Positioner sideOffset={8}>
                        <DropdownMenu.Popup className="relative min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg">
                          <DropdownMenu.Arrow className="data-[side=right]:left-[-13px] rotate-270">
                            <ArrowSvg />
                          </DropdownMenu.Arrow>
                          <DropdownMenu.Surface>
                            <DropdownMenu.List className="p-1 focus:outline-none">
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                onSelect={() => toast('Option A')}
                              >
                                Option A
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                onSelect={() => toast('Option B')}
                              >
                                Option B
                              </DropdownMenu.Item>

                              {/* Second nested Submenu */}
                              <DropdownMenu.Submenu>
                                <DropdownMenu.SubmenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100">
                                  <span>Deep Options</span>
                                  <DropdownMenu.SubmenuTriggerIndicator className="text-muted-foreground/75 shrink-0 size-4">
                                    <CaretRightIcon className="size-full" />
                                  </DropdownMenu.SubmenuTriggerIndicator>
                                </DropdownMenu.SubmenuTrigger>
                                <DropdownMenu.Portal>
                                  <DropdownMenu.Backdrop className="fixed inset-0 bg-black/5 pointer-events-none" />
                                  <DropdownMenu.Positioner sideOffset={8}>
                                    <DropdownMenu.Popup className="relative min-w-[160px] rounded-lg border border-gray-200 bg-white shadow-lg">
                                      <DropdownMenu.Arrow className="data-[side=right]:left-[-13px] rotate-270">
                                        <ArrowSvg />
                                      </DropdownMenu.Arrow>
                                      <DropdownMenu.Surface>
                                        <DropdownMenu.List className="p-1 focus:outline-none">
                                          <DropdownMenu.Item
                                            className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                            onSelect={() => toast('Deep 1')}
                                          >
                                            Deep Option 1
                                          </DropdownMenu.Item>
                                          <DropdownMenu.Item
                                            className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                            onSelect={() => toast('Deep 2')}
                                          >
                                            Deep Option 2
                                          </DropdownMenu.Item>
                                          <DropdownMenu.Item
                                            className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                            onSelect={() => toast('Deep 3')}
                                          >
                                            Deep Option 3
                                          </DropdownMenu.Item>
                                        </DropdownMenu.List>
                                      </DropdownMenu.Surface>
                                    </DropdownMenu.Popup>
                                  </DropdownMenu.Positioner>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Submenu>
                            </DropdownMenu.List>
                          </DropdownMenu.Surface>
                        </DropdownMenu.Popup>
                      </DropdownMenu.Positioner>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Submenu>

                  <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 data-[highlighted]:bg-red-50"
                    onSelect={() => toast('Logout')}
                  >
                    Logout
                  </DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-[canvas]"
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className="fill-gray-200 dark:fill-none"
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className="dark:fill-gray-300"
      />
    </svg>
  )
}
