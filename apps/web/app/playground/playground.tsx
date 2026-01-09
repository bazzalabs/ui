'use client'

import { DropdownMenu } from '@bazza-ui/react'
import * as React from 'react'
import { toast } from 'sonner'

export function Playground() {
  return (
    <div className="grid grid-cols-3 gap-8 p-8">
      <BasicExample />
      <SearchableExample />
      <GroupedExample />
      <ControlledExample />
      <SubmenuExample />
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
            <DropdownMenu.Popup className="min-w-[200px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
              <DropdownMenu.Surface>
                <DropdownMenu.List className="focus:outline-none">
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
            <DropdownMenu.Popup className="min-w-[200px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
              <DropdownMenu.Surface>
                <DropdownMenu.List className="focus:outline-none">
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
                      <span className="text-gray-400">→</span>
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
                                  <span className="text-gray-400">→</span>
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
                      <span className="text-gray-400">→</span>
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
