'use client'

import { Collapsible } from '@base-ui/react/collapsible'
import {
  Combobox,
  type ComboboxVirtualItem,
  ContextMenu,
  DropdownMenu,
  type DropdownMenuVirtualItem,
  Select as SelectPrimitive,
  type SelectVirtualItem,
} from '@bazza-ui/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import * as React from 'react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

// ============================================================================
// Config Panel Components
// ============================================================================

interface ConfigPanelProps {
  title: string
  children: React.ReactNode
}

function ConfigPanel({ title, children }: ConfigPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-2">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  )
}

interface ConfigRowProps {
  label: string
  description?: string
  children: React.ReactNode
}

function ConfigRow({ label, description, children }: ConfigRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {description && (
          <div className="text-xs text-gray-400">{description}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        checked ? 'bg-blue-600' : 'bg-gray-200',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

interface SelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: SelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

function NumberInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}: NumberInputProps) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  )
}

// ============================================================================
// Demo Layout Components
// ============================================================================

interface DemoSectionProps {
  title: string
  description: string
  children: React.ReactNode
}

function DemoSection({ title, description, children }: DemoSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex flex-wrap items-start gap-6">{children}</div>
    </section>
  )
}

interface DemoCardProps {
  children: React.ReactNode
}

function DemoCard({ children }: DemoCardProps) {
  return (
    <div className="flex min-h-[200px] min-w-[300px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8">
      {children}
    </div>
  )
}

// ============================================================================
// Main Playground
// ============================================================================

// ============================================================================
// Collapsible Section Component
// ============================================================================

interface CollapsibleSectionProps {
  title: string
  description: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function CollapsibleSection({
  title,
  description,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  return (
    <Collapsible.Root
      defaultOpen={defaultOpen}
      className="border-b border-gray-200"
    >
      <Collapsible.Trigger className="sticky top-12 z-10 flex w-full items-center justify-between py-4 text-left bg-white hover:bg-gray-50 transition-colors group">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <CollapsibleChevron className="h-5 w-5 text-gray-400 transition-transform duration-200 group-data-[panel-open]:rotate-90" />
      </Collapsible.Trigger>
      <Collapsible.Panel className="overflow-hidden data-[starting-style]:h-0 data-[ending-style]:h-0 transition-[height] duration-300">
        <div className="space-y-8 py-6">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

export function Playground() {
  return (
    <div className="space-y-4 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Component Playground
        </h1>
        <p className="text-gray-500">
          Interactive demos to explore DropdownMenu, ContextMenu, and Select
          component features
        </p>
      </div>

      {/* Combobox Section */}
      <CollapsibleSection
        title="Combobox"
        description="Input-based select with filtering and search functionality"
        defaultOpen={true}
      >
        <BasicComboboxDemo />
        <MultiComboboxDemo />
        <FilterableComboboxDemo />
        <GroupedComboboxDemo />
        <VirtualizedComboboxDemo />
      </CollapsibleSection>

      {/* Select Section */}
      <CollapsibleSection
        title="Select"
        description="Form-compatible select with single and multi-select support"
        defaultOpen={false}
      >
        <BasicSelectDemo />
        <MultiSelectDemo />
        <SearchableSelectDemo />
        <GroupedSelectDemo />
        <VirtualizedSelectDemo />
        <FormIntegrationDemo />
      </CollapsibleSection>

      {/* DropdownMenu Section */}
      <CollapsibleSection
        title="DropdownMenu"
        description="Menu components with virtualization, shortcuts, and search"
      >
        <VirtualizationDemo />
        <KeyboardShortcutsDemo />
        <SurfaceSearchDemo />
        <PositioningDemo />
        <SelectionsDemo />
        <SubmenuDemo />
        <TriggerBehaviorDemo />
      </CollapsibleSection>

      {/* ContextMenu Section */}
      <CollapsibleSection
        title="ContextMenu"
        description="Right-click context menus with submenus, checkboxes, radio groups"
      >
        <ContextMenuDemo />
      </CollapsibleSection>
    </div>
  )
}

// ============================================================================
// Combobox Demo: Basic Combobox
// ============================================================================

function BasicComboboxDemo() {
  const [value, setValue] = React.useState('')
  const [openOnFocus, setOpenOnFocus] = React.useState(true)

  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
    { value: 'br', label: 'Brazil' },
  ]

  // Create an items map for displaying value labels before items mount
  const countryItems = React.useMemo(
    () => Object.fromEntries(countries.map((c) => [c.value, c.label])),
    [],
  )

  const selectedCountry = countries.find((c) => c.value === value)

  return (
    <DemoSection
      title="Basic Combobox"
      description="A simple combobox with input-as-trigger and filtering"
    >
      <DemoCard>
        <div className="text-center">
          <div className="mb-2 text-xs text-gray-400">
            Selected: {selectedCountry?.label ?? 'None'}
          </div>
          <Combobox.Root
            value={value}
            onValueChange={setValue}
            items={countryItems}
            openOnFocus={openOnFocus}
          >
            <div className="relative">
              <Combobox.Input
                placeholder="Search countries..."
                className="w-[250px] rounded-md border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <Combobox.Clear className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600">
                <CloseIcon className="h-4 w-4" />
              </Combobox.Clear>
              <Combobox.Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 data-[popup-open]:rotate-180 transition-transform pointer-events-none">
                <ChevronDownIcon className="h-4 w-4" />
              </Combobox.Icon>
            </div>
            <Combobox.Portal>
              <Combobox.Positioner sideOffset={4}>
                <Combobox.Popup className="w-[250px] rounded-lg border border-gray-200 bg-white shadow-lg">
                  <Combobox.Surface>
                    <Combobox.List className="max-h-[300px] overflow-y-auto p-1 focus:outline-none">
                      {countries.map((country) => (
                        <Combobox.Item
                          key={country.value}
                          value={country.value}
                          textValue={country.label}
                          className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50 data-[selected]:font-medium"
                        >
                          <Combobox.ItemLabel>
                            {country.label}
                          </Combobox.ItemLabel>
                          <Combobox.ItemIndicator className="text-blue-600">
                            <CheckIcon className="h-4 w-4" />
                          </Combobox.ItemIndicator>
                        </Combobox.Item>
                      ))}
                    </Combobox.List>
                    <Combobox.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                      No countries found
                    </Combobox.Empty>
                  </Combobox.Surface>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </div>
      </DemoCard>

      <ConfigPanel title="Root Props">
        <ConfigRow
          label="openOnFocus"
          description="Open popup when input is focused"
        >
          <Toggle checked={openOnFocus} onChange={setOpenOnFocus} />
        </ConfigRow>
      </ConfigPanel>

      <ConfigPanel title="Current State">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Value:</strong> {value || '(empty)'}
          </p>
          <p>
            <strong>Label:</strong> {selectedCountry?.label ?? 'None selected'}
          </p>
        </div>
      </ConfigPanel>

      <ConfigPanel title="Features">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Input as trigger:</strong> Click or type to open popup
          </p>
          <p>
            <strong>Value sync:</strong> Input shows selected value when closed
          </p>
          <p>
            <strong>Clear button:</strong> Clears the selected value
          </p>
          <p>
            <strong>Fuzzy filtering:</strong> Type to filter items
          </p>
        </div>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Combobox Demo: Multi-Select Combobox
// ============================================================================

function MultiComboboxDemo() {
  const [values, setValues] = React.useState<string[]>(['react'])
  const [closeOnSelect, setCloseOnSelect] = React.useState(false)

  const frameworks = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'Solid' },
    { value: 'qwik', label: 'Qwik' },
    { value: 'preact', label: 'Preact' },
    { value: 'lit', label: 'Lit' },
  ]

  return (
    <DemoSection
      title="Multi-Select Combobox"
      description="Select multiple values with toggle behavior"
    >
      <DemoCard>
        <div className="text-center">
          <div className="mb-2 text-xs text-gray-400">
            Selected: {values.length} framework{values.length !== 1 ? 's' : ''}
          </div>
          <Combobox.Root
            multiple
            values={values}
            onValuesChange={setValues}
            closeOnSelect={closeOnSelect}
          >
            <div className="relative">
              <Combobox.Input
                placeholder="Select frameworks..."
                className="w-[280px] rounded-md border border-gray-300 px-4 py-2 pr-16 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              <Combobox.Clear className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600">
                <CloseIcon className="h-4 w-4" />
              </Combobox.Clear>
              <Combobox.Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 data-[popup-open]:rotate-180 transition-transform pointer-events-none">
                <ChevronDownIcon className="h-4 w-4" />
              </Combobox.Icon>
            </div>
            <Combobox.Portal>
              <Combobox.Positioner sideOffset={4}>
                <Combobox.Popup className="w-[280px] rounded-lg border border-gray-200 bg-white shadow-lg">
                  <Combobox.Surface>
                    <Combobox.List className="max-h-[300px] overflow-y-auto p-1 focus:outline-none">
                      {frameworks.map((fw) => (
                        <Combobox.Item
                          key={fw.value}
                          value={fw.value}
                          textValue={fw.label}
                          className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[highlighted]:bg-purple-50 data-[selected]:font-medium"
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 group-data-[selected]:border-purple-600 group-data-[selected]:bg-purple-600">
                            <Combobox.ItemIndicator className="text-white">
                              <CheckIcon className="h-3 w-3" />
                            </Combobox.ItemIndicator>
                          </span>
                          <Combobox.ItemLabel>{fw.label}</Combobox.ItemLabel>
                        </Combobox.Item>
                      ))}
                    </Combobox.List>
                    <Combobox.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                      No frameworks found
                    </Combobox.Empty>
                  </Combobox.Surface>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </div>
      </DemoCard>

      <ConfigPanel title="Root Props">
        <ConfigRow
          label="closeOnSelect"
          description="Close popup after selecting"
        >
          <Toggle checked={closeOnSelect} onChange={setCloseOnSelect} />
        </ConfigRow>
      </ConfigPanel>

      <ConfigPanel title="Selected Values">
        <div className="flex flex-wrap gap-1">
          {values.length === 0 ? (
            <span className="text-sm text-gray-400">None selected</span>
          ) : (
            values.map((v) => (
              <span
                key={v}
                className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
              >
                {frameworks.find((f) => f.value === v)?.label ?? v}
              </span>
            ))
          )}
        </div>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Combobox Demo: Filterable Combobox
// ============================================================================

function FilterableComboboxDemo() {
  const [value, setValue] = React.useState('')
  const [filterEnabled, setFilterEnabled] = React.useState(true)

  const timezones = [
    {
      value: 'pst',
      label: 'Pacific Time (PT)',
      keywords: ['los angeles', 'seattle', 'san francisco'],
    },
    {
      value: 'mst',
      label: 'Mountain Time (MT)',
      keywords: ['denver', 'phoenix', 'salt lake'],
    },
    {
      value: 'cst',
      label: 'Central Time (CT)',
      keywords: ['chicago', 'dallas', 'houston'],
    },
    {
      value: 'est',
      label: 'Eastern Time (ET)',
      keywords: ['new york', 'miami', 'boston'],
    },
    {
      value: 'gmt',
      label: 'Greenwich Mean Time (GMT)',
      keywords: ['london', 'uk', 'england'],
    },
    {
      value: 'cet',
      label: 'Central European Time (CET)',
      keywords: ['paris', 'berlin', 'rome'],
    },
    {
      value: 'jst',
      label: 'Japan Standard Time (JST)',
      keywords: ['tokyo', 'osaka', 'japan'],
    },
    {
      value: 'aest',
      label: 'Australian Eastern Time (AEST)',
      keywords: ['sydney', 'melbourne', 'australia'],
    },
  ]

  return (
    <DemoSection
      title="Filterable Combobox"
      description="Filter items with keywords for better matching"
    >
      <DemoCard>
        <div className="text-center">
          <div className="mb-2 text-xs text-gray-400">
            Try searching "new york" or "tokyo"
          </div>
          <Combobox.Root value={value} onValueChange={setValue}>
            <div className="relative">
              <Combobox.Input
                placeholder="Search timezones..."
                className="w-[300px] rounded-md border border-gray-300 px-4 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
              <Combobox.Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 data-[popup-open]:rotate-180 transition-transform pointer-events-none">
                <ChevronDownIcon className="h-4 w-4" />
              </Combobox.Icon>
            </div>
            <Combobox.Portal>
              <Combobox.Positioner sideOffset={4}>
                <Combobox.Popup className="w-[300px] rounded-lg border border-gray-200 bg-white shadow-lg">
                  <Combobox.Surface filter={filterEnabled ? undefined : false}>
                    <Combobox.List className="max-h-[250px] overflow-y-auto p-1 focus:outline-none">
                      {timezones.map((tz) => (
                        <Combobox.Item
                          key={tz.value}
                          value={tz.value}
                          keywords={tz.keywords}
                          textValue={tz.label}
                          className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-green-50"
                        >
                          <Combobox.ItemLabel>{tz.label}</Combobox.ItemLabel>
                          <Combobox.ItemIndicator className="text-green-600">
                            <CheckIcon className="h-4 w-4" />
                          </Combobox.ItemIndicator>
                        </Combobox.Item>
                      ))}
                    </Combobox.List>
                    <Combobox.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                      No timezones found
                    </Combobox.Empty>
                  </Combobox.Surface>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </div>
      </DemoCard>

      <ConfigPanel title="Surface Props">
        <ConfigRow label="filter" description="Enable fuzzy search filtering">
          <Toggle checked={filterEnabled} onChange={setFilterEnabled} />
        </ConfigRow>
      </ConfigPanel>

      <ConfigPanel title="Search Features">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Fuzzy matching:</strong> Matches partial text in value
          </p>
          <p>
            <strong>Keywords:</strong> Match against additional keywords (e.g.,
            cities)
          </p>
          <p>
            <strong>Empty state:</strong> Shows message when no matches found
          </p>
        </div>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Combobox Demo: Grouped Combobox
// ============================================================================

function GroupedComboboxDemo() {
  const [value, setValue] = React.useState('')

  const foodGroups = [
    {
      label: 'Fruits',
      items: [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'orange', label: 'Orange' },
        { value: 'strawberry', label: 'Strawberry' },
      ],
    },
    {
      label: 'Vegetables',
      items: [
        { value: 'carrot', label: 'Carrot' },
        { value: 'broccoli', label: 'Broccoli' },
        { value: 'spinach', label: 'Spinach' },
        { value: 'tomato', label: 'Tomato' },
      ],
    },
    {
      label: 'Proteins',
      items: [
        { value: 'chicken', label: 'Chicken' },
        { value: 'beef', label: 'Beef' },
        { value: 'fish', label: 'Fish' },
        { value: 'tofu', label: 'Tofu' },
      ],
    },
  ]

  return (
    <DemoSection
      title="Grouped Combobox"
      description="Organize items into labeled groups with separators"
    >
      <DemoCard>
        <Combobox.Root value={value} onValueChange={setValue}>
          <div className="relative">
            <Combobox.Input
              placeholder="Choose a food..."
              className="w-[240px] rounded-md border border-gray-300 px-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            <Combobox.Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 data-[popup-open]:rotate-180 transition-transform pointer-events-none">
              <ChevronDownIcon className="h-4 w-4" />
            </Combobox.Icon>
          </div>
          <Combobox.Portal>
            <Combobox.Positioner sideOffset={4}>
              <Combobox.Popup className="w-[240px] rounded-lg border border-gray-200 bg-white shadow-lg">
                <Combobox.Surface>
                  <Combobox.ScrollUpArrow className="flex h-6 items-center justify-center border-b border-gray-100 text-gray-400">
                    <ChevronUpIcon className="h-4 w-4" />
                  </Combobox.ScrollUpArrow>
                  <Combobox.List className="max-h-[200px] overflow-y-auto p-1 focus:outline-none">
                    {foodGroups.map((group, index) => (
                      <React.Fragment key={group.label}>
                        {index > 0 && (
                          <Combobox.Separator className="my-1 h-px bg-gray-200" />
                        )}
                        <Combobox.Group>
                          <Combobox.GroupLabel className="px-3 py-1.5 text-xs font-semibold text-gray-500">
                            {group.label}
                          </Combobox.GroupLabel>
                          {group.items.map((item) => (
                            <Combobox.Item
                              key={item.value}
                              value={item.value}
                              textValue={item.label}
                              className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-amber-50"
                            >
                              <Combobox.ItemLabel>
                                {item.label}
                              </Combobox.ItemLabel>
                              <Combobox.ItemIndicator className="text-amber-600">
                                <CheckIcon className="h-4 w-4" />
                              </Combobox.ItemIndicator>
                            </Combobox.Item>
                          ))}
                        </Combobox.Group>
                      </React.Fragment>
                    ))}
                  </Combobox.List>
                  <Combobox.ScrollDownArrow className="flex h-6 items-center justify-center border-t border-gray-100 text-gray-400">
                    <ChevronDownIcon className="h-4 w-4" />
                  </Combobox.ScrollDownArrow>
                  <Combobox.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                    No foods found
                  </Combobox.Empty>
                </Combobox.Surface>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      </DemoCard>

      <ConfigPanel title="Current Selection">
        <div className="text-sm text-gray-600">
          <p>
            <strong>Value:</strong> {value || '(none)'}
          </p>
          <p>
            <strong>Group:</strong>{' '}
            {foodGroups.find((g) => g.items.some((i) => i.value === value))
              ?.label ?? 'N/A'}
          </p>
        </div>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Combobox Demo: Virtualized Combobox
// ============================================================================

function VirtualizedComboboxDemo() {
  const [value, setValue] = React.useState('')
  const [inputValue, setInputValue] = React.useState('')
  const [scrollElement, setScrollElement] =
    React.useState<HTMLDivElement | null>(null)
  const [itemCount, setItemCount] = React.useState(1000)

  // Generate items
  const allItems = React.useMemo(() => {
    const categories = ['User', 'Project', 'Task', 'Document', 'Event']
    const items: ComboboxVirtualItem[] = []
    for (let i = 0; i < itemCount; i++) {
      const category = categories[i % categories.length]
      items.push({
        value: `${category?.toLowerCase()}-${i + 1}`,
      })
    }
    return items
  }, [itemCount])

  // Filter items
  const filteredItems = React.useMemo(() => {
    if (!inputValue) return allItems
    const lowerSearch = inputValue.toLowerCase()
    return allItems.filter((item) => item.value.includes(lowerSearch))
  }, [inputValue, allItems])

  const itemHeight = 36
  const listHeight = 300

  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => itemHeight,
    overscan: 5,
  })

  const virtualizerRef = React.useRef(virtualizer)
  virtualizerRef.current = virtualizer

  const handleHighlightChange = React.useCallback(
    (highlightedValue: string | null, index: number) => {
      if (index >= 0) {
        queueMicrotask(() => {
          virtualizerRef.current.scrollToIndex(index, { align: 'auto' })
        })
      }
    },
    [],
  )

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open && scrollElement) {
        scrollElement.scrollTop = 0
        setInputValue('')
      }
    },
    [scrollElement],
  )

  return (
    <DemoSection
      title="Virtualized Combobox"
      description="Efficiently render thousands of items with virtualization"
    >
      <DemoCard>
        <div className="text-center">
          <div className="mb-2 text-xs text-gray-400">
            {filteredItems.length.toLocaleString()} items
          </div>
          <Combobox.Root
            value={value}
            onValueChange={setValue}
            inputValue={inputValue}
            onInputValueChange={setInputValue}
            virtualized
            virtualItems={filteredItems}
            onHighlightChange={handleHighlightChange}
            onOpenChange={handleOpenChange}
          >
            <div className="relative">
              <Combobox.Input
                placeholder={`Search ${itemCount.toLocaleString()} items...`}
                className="w-[300px] rounded-md border border-gray-300 px-4 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <Combobox.Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 data-[popup-open]:rotate-180 transition-transform pointer-events-none">
                <ChevronDownIcon className="h-4 w-4" />
              </Combobox.Icon>
            </div>
            <Combobox.Portal>
              <Combobox.Positioner sideOffset={4}>
                <Combobox.Popup className="w-[300px] rounded-lg border border-gray-200 bg-white shadow-lg">
                  <Combobox.Surface filter={false}>
                    <Combobox.List
                      ref={setScrollElement}
                      className="overflow-auto p-1 focus:outline-none scroll-py-1"
                      style={{ height: listHeight }}
                    >
                      <div
                        style={{
                          height: virtualizer.getTotalSize(),
                          width: '100%',
                          position: 'relative',
                        }}
                      >
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                          const item = filteredItems[virtualRow.index]
                          if (!item) return null
                          return (
                            <Combobox.Item
                              key={item.value}
                              value={item.value}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: itemHeight,
                                transform: `translateY(${virtualRow.start}px)`,
                              }}
                              className="flex cursor-pointer items-center justify-between rounded-md px-3 text-sm data-[highlighted]:bg-cyan-50"
                            >
                              <span className="capitalize">
                                {item.value.replace('-', ' #')}
                              </span>
                              <Combobox.ItemIndicator className="text-cyan-600">
                                <CheckIcon className="h-4 w-4" />
                              </Combobox.ItemIndicator>
                            </Combobox.Item>
                          )
                        })}
                      </div>
                    </Combobox.List>
                    <Combobox.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                      No items found
                    </Combobox.Empty>
                  </Combobox.Surface>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </div>
      </DemoCard>

      <ConfigPanel title="Virtualizer Config">
        <ConfigRow label="itemCount" description="Total number of items">
          <Select
            value={String(itemCount)}
            onChange={(v) => setItemCount(Number(v))}
            options={[
              { value: '100', label: '100' },
              { value: '1000', label: '1,000' },
              { value: '10000', label: '10,000' },
              { value: '50000', label: '50,000' },
            ]}
          />
        </ConfigRow>
      </ConfigPanel>

      <ConfigPanel title="How it works">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>virtualized prop:</strong> Enables virtualization mode
          </p>
          <p>
            <strong>virtualItems prop:</strong> Pre-registers items for keyboard
            nav
          </p>
          <p>
            <strong>onHighlightChange:</strong> Syncs scroll position
          </p>
          <p>
            <strong>filter=false:</strong> Consumer handles filtering
          </p>
        </div>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Select Demo: Basic Single Select
// ============================================================================

function BasicSelectDemo() {
  const [value, setValue] = React.useState('de')
  const [alignItemWithTrigger, setAlignItemWithTrigger] = React.useState(true)

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

  // Create an items map for displaying value labels before items mount
  const countryItems = React.useMemo(
    () => Object.fromEntries(countries.map((c) => [c.value, c.label])),
    [],
  )

  const selectedCountry = countries.find((c) => c.value === value)

  return (
    <DemoSection
      title="Basic Single Select"
      description="A simple single-select dropdown with alignItemWithTrigger positioning"
    >
      <DemoCard>
        <div className="text-center">
          <div className="mb-2 text-xs text-gray-400">
            Selected: {selectedCountry?.label ?? 'None'}
          </div>
          <SelectPrimitive.Root
            value={value}
            onValueChange={setValue}
            items={countryItems}
          >
            <SelectPrimitive.Trigger className="inline-flex min-w-[200px] items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 data-[placeholder]:text-gray-400">
              <SelectPrimitive.Value placeholder="Select a country..." />
              <SelectPrimitive.Icon className="text-gray-400 data-[popup-open]:rotate-180 transition-transform">
                <ChevronDownIcon className="h-4 w-4" />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Positioner
                sideOffset={8}
                alignItemWithTrigger={alignItemWithTrigger}
              >
                <SelectPrimitive.Popup className="min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg">
                  <SelectPrimitive.Surface>
                    <SelectPrimitive.Input
                      // hideUntilActive
                      placeholder="Search countries..."
                      className="w-full border-b border-gray-200 px-3 py-2 text-sm outline-none focus:bg-gray-50 rounded-t-lg"
                    />
                    <SelectPrimitive.List className="max-h-[300px] overflow-y-auto p-1 focus:outline-none">
                      {countries.map((country) => (
                        <SelectPrimitive.Item
                          key={country.value}
                          value={country.value}
                          textValue={country.label}
                          keywords={[country.label]}
                          className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50 data-[selected]:font-medium"
                        >
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <SelectPrimitive.ItemLabel />
                          </span>
                          <SelectPrimitive.ItemIndicator className="text-blue-600">
                            <CheckIcon className="h-4 w-4" />
                          </SelectPrimitive.ItemIndicator>
                        </SelectPrimitive.Item>
                      ))}
                    </SelectPrimitive.List>
                    <SelectPrimitive.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                      No countries found
                    </SelectPrimitive.Empty>
                  </SelectPrimitive.Surface>
                </SelectPrimitive.Popup>
              </SelectPrimitive.Positioner>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        </div>
      </DemoCard>

      <ConfigPanel title="Positioner Props">
        <ConfigRow
          label="alignItemWithTrigger"
          description="Align selected item text with trigger"
        >
          <Toggle
            checked={alignItemWithTrigger}
            onChange={setAlignItemWithTrigger}
          />
        </ConfigRow>
      </ConfigPanel>

      <ConfigPanel title="Current State">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Value:</strong> {value || '(empty)'}
          </p>
          <p>
            <strong>Label:</strong> {selectedCountry?.label ?? 'None selected'}
          </p>
        </div>
      </ConfigPanel>

      <ConfigPanel title="Features">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>alignItemWithTrigger:</strong> Positions popup so selected
            item aligns with trigger
          </p>
          <p>
            <strong>Auto-fallback:</strong> Falls back to normal positioning if
            near viewport edges
          </p>
          <p>
            <strong>ItemLabel:</strong> Captures text for display and alignment
          </p>
        </div>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Select Demo: Multi Select
// ============================================================================

function MultiSelectDemo() {
  const [values, setValues] = React.useState<string[]>(['react'])

  const frameworks = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'Solid' },
    { value: 'qwik', label: 'Qwik' },
    { value: 'preact', label: 'Preact' },
    { value: 'lit', label: 'Lit' },
  ]

  return (
    <DemoSection
      title="Multi Select"
      description="Select multiple values that stay open for continued selection"
    >
      <DemoCard>
        <div className="text-center">
          <div className="mb-2 text-xs text-gray-400">
            Selected: {values.length} framework{values.length !== 1 ? 's' : ''}
          </div>
          <SelectPrimitive.Root
            multiple
            values={values}
            onValuesChange={setValues}
          >
            <SelectPrimitive.Trigger className="inline-flex min-w-[250px] items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 data-[placeholder]:text-gray-400">
              <SelectPrimitive.Value placeholder="Select frameworks...">
                {({ values: selectedValues, getValueText }) => {
                  if (selectedValues.length === 0) return 'Select frameworks...'
                  if (selectedValues.length === 1) {
                    return getValueText(selectedValues[0]!) ?? selectedValues[0]
                  }
                  if (selectedValues.length <= 3) {
                    return selectedValues
                      .map((v) => getValueText(v) ?? v)
                      .join(', ')
                  }
                  return `${selectedValues.length} selected`
                }}
              </SelectPrimitive.Value>
              <SelectPrimitive.Icon className="text-gray-400 data-[popup-open]:rotate-180 transition-transform">
                <ChevronDownIcon className="h-4 w-4" />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Positioner sideOffset={8}>
                <SelectPrimitive.Popup className="min-w-[250px] rounded-lg border border-gray-200 bg-white shadow-lg">
                  <SelectPrimitive.Surface>
                    <SelectPrimitive.Input
                      hideUntilActive
                      placeholder="Search frameworks..."
                      className="w-full border-b border-gray-200 px-3 py-2 text-sm outline-none focus:bg-gray-50"
                    />
                    <SelectPrimitive.List className="max-h-[300px] overflow-y-auto p-1 focus:outline-none">
                      {frameworks.map((fw) => (
                        <SelectPrimitive.Item
                          key={fw.value}
                          value={fw.value}
                          textValue={fw.label}
                          className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[highlighted]:bg-purple-50 data-[selected]:font-medium"
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 group-data-[selected]:border-purple-600 group-data-[selected]:bg-purple-600">
                            <SelectPrimitive.ItemIndicator className="text-white">
                              <CheckIcon className="h-3 w-3" />
                            </SelectPrimitive.ItemIndicator>
                          </span>
                          <SelectPrimitive.ItemLabel>
                            {fw.label}
                          </SelectPrimitive.ItemLabel>
                        </SelectPrimitive.Item>
                      ))}
                    </SelectPrimitive.List>
                    <SelectPrimitive.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                      No frameworks found
                    </SelectPrimitive.Empty>
                  </SelectPrimitive.Surface>
                </SelectPrimitive.Popup>
              </SelectPrimitive.Positioner>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        </div>
      </DemoCard>

      <ConfigPanel title="Selected Values">
        <div className="flex flex-wrap gap-1">
          {values.length === 0 ? (
            <span className="text-sm text-gray-400">None selected</span>
          ) : (
            values.map((v) => (
              <span
                key={v}
                className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
              >
                {frameworks.find((f) => f.value === v)?.label ?? v}
              </span>
            ))
          )}
        </div>
      </ConfigPanel>

      <ConfigPanel title="Multi-Select Behavior">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Stays open:</strong> Menu remains open after selection
          </p>
          <p>
            <strong>Toggle:</strong> Clicking selected item deselects it
          </p>
          <p>
            <strong>Custom render:</strong> Value shows count or comma-separated
            list
          </p>
        </div>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Select Demo: Searchable Select
// ============================================================================

function SearchableSelectDemo() {
  const [value, setValue] = React.useState('')
  const [filterEnabled, setFilterEnabled] = React.useState(true)

  const timezones = [
    {
      value: 'pst',
      label: 'Pacific Time (PT)',
      keywords: ['los angeles', 'seattle', 'san francisco'],
    },
    {
      value: 'mst',
      label: 'Mountain Time (MT)',
      keywords: ['denver', 'phoenix', 'salt lake'],
    },
    {
      value: 'cst',
      label: 'Central Time (CT)',
      keywords: ['chicago', 'dallas', 'houston'],
    },
    {
      value: 'est',
      label: 'Eastern Time (ET)',
      keywords: ['new york', 'miami', 'boston'],
    },
    {
      value: 'gmt',
      label: 'Greenwich Mean Time (GMT)',
      keywords: ['london', 'uk', 'england'],
    },
    {
      value: 'cet',
      label: 'Central European Time (CET)',
      keywords: ['paris', 'berlin', 'rome'],
    },
    {
      value: 'jst',
      label: 'Japan Standard Time (JST)',
      keywords: ['tokyo', 'osaka', 'japan'],
    },
    {
      value: 'aest',
      label: 'Australian Eastern Time (AEST)',
      keywords: ['sydney', 'melbourne', 'australia'],
    },
  ]

  return (
    <DemoSection
      title="Searchable Select"
      description="Filter items with fuzzy search, supports keywords for better matching"
    >
      <DemoCard>
        <div className="text-center">
          <div className="mb-2 text-xs text-gray-400">
            Try searching "new york" or "tokyo"
          </div>
          <SelectPrimitive.Root value={value} onValueChange={setValue}>
            <SelectPrimitive.Trigger className="inline-flex min-w-[280px] items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 data-[placeholder]:text-gray-400">
              <SelectPrimitive.Value placeholder="Select timezone..." />
              <SelectPrimitive.Icon className="text-gray-400 transition-transform data-[popup-open]:rotate-180">
                <ChevronDownIcon className="h-4 w-4" />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Positioner sideOffset={8}>
                <SelectPrimitive.Popup className="min-w-[280px] rounded-lg border border-gray-200 bg-white shadow-lg">
                  <SelectPrimitive.Surface
                    filter={filterEnabled ? undefined : false}
                  >
                    <div className="border-b border-gray-200 p-2">
                      <SelectPrimitive.Input
                        placeholder="Search timezones..."
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <SelectPrimitive.List className="max-h-[250px] overflow-y-auto p-1 focus:outline-none">
                      {timezones.map((tz) => (
                        <SelectPrimitive.Item
                          key={tz.value}
                          value={tz.value}
                          keywords={tz.keywords}
                          textValue={tz.label}
                          className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-green-50"
                        >
                          <SelectPrimitive.ItemLabel>
                            {tz.label}
                          </SelectPrimitive.ItemLabel>
                          <SelectPrimitive.ItemIndicator className="text-green-600">
                            <CheckIcon className="h-4 w-4" />
                          </SelectPrimitive.ItemIndicator>
                        </SelectPrimitive.Item>
                      ))}
                    </SelectPrimitive.List>
                    <SelectPrimitive.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                      No timezones found
                    </SelectPrimitive.Empty>
                  </SelectPrimitive.Surface>
                </SelectPrimitive.Popup>
              </SelectPrimitive.Positioner>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        </div>
      </DemoCard>

      <ConfigPanel title="Surface Props">
        <ConfigRow label="filter" description="Enable fuzzy search filtering">
          <Toggle checked={filterEnabled} onChange={setFilterEnabled} />
        </ConfigRow>
      </ConfigPanel>

      <ConfigPanel title="Search Features">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Fuzzy matching:</strong> Matches partial text in value
          </p>
          <p>
            <strong>Keywords:</strong> Match against additional keywords (e.g.,
            cities)
          </p>
          <p>
            <strong>Empty state:</strong> Shows message when no matches found
          </p>
        </div>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Select Demo: Grouped Select
// ============================================================================

function GroupedSelectDemo() {
  const [value, setValue] = React.useState('')

  const foodGroups = [
    {
      label: 'Fruits',
      items: [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'orange', label: 'Orange' },
        { value: 'strawberry', label: 'Strawberry' },
      ],
    },
    {
      label: 'Vegetables',
      items: [
        { value: 'carrot', label: 'Carrot' },
        { value: 'broccoli', label: 'Broccoli' },
        { value: 'spinach', label: 'Spinach' },
        { value: 'tomato', label: 'Tomato' },
      ],
    },
    {
      label: 'Proteins',
      items: [
        { value: 'chicken', label: 'Chicken' },
        { value: 'beef', label: 'Beef' },
        { value: 'fish', label: 'Fish' },
        { value: 'tofu', label: 'Tofu' },
      ],
    },
  ]

  return (
    <DemoSection
      title="Grouped Select"
      description="Organize items into labeled groups with separators"
    >
      <DemoCard>
        <SelectPrimitive.Root value={value} onValueChange={setValue}>
          <SelectPrimitive.Trigger className="inline-flex min-w-[220px] items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 data-[placeholder]:text-gray-400">
            <SelectPrimitive.Value placeholder="Choose a food..." />
            <SelectPrimitive.Icon className="text-gray-400 transition-transform data-[popup-open]:rotate-180">
              <ChevronDownIcon className="h-4 w-4" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Positioner sideOffset={8}>
              <SelectPrimitive.Popup className="min-w-[220px] rounded-lg border border-gray-200 bg-white shadow-lg">
                <SelectPrimitive.Surface>
                  <SelectPrimitive.Input
                    hideUntilActive
                    placeholder="Search foods..."
                    className="w-full border-b border-gray-200 px-3 py-2 text-sm outline-none focus:bg-gray-50"
                  />
                  <SelectPrimitive.ScrollUpArrow className="flex h-6 items-center justify-center border-b border-gray-100 text-gray-400">
                    <ChevronUpIcon className="h-4 w-4" />
                  </SelectPrimitive.ScrollUpArrow>
                  <SelectPrimitive.List className="max-h-[200px] overflow-y-auto p-1 focus:outline-none">
                    {foodGroups.map((group, index) => (
                      <React.Fragment key={group.label}>
                        {index > 0 && (
                          <SelectPrimitive.Separator className="my-1 h-px bg-gray-200" />
                        )}
                        <SelectPrimitive.Group>
                          <SelectPrimitive.GroupLabel className="px-3 py-1.5 text-xs font-semibold text-gray-500">
                            {group.label}
                          </SelectPrimitive.GroupLabel>
                          {group.items.map((item) => (
                            <SelectPrimitive.Item
                              key={item.value}
                              value={item.value}
                              textValue={item.label}
                              className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-amber-50"
                            >
                              <SelectPrimitive.ItemLabel>
                                {item.label}
                              </SelectPrimitive.ItemLabel>
                              <SelectPrimitive.ItemIndicator className="text-amber-600">
                                <CheckIcon className="h-4 w-4" />
                              </SelectPrimitive.ItemIndicator>
                            </SelectPrimitive.Item>
                          ))}
                        </SelectPrimitive.Group>
                      </React.Fragment>
                    ))}
                  </SelectPrimitive.List>
                  <SelectPrimitive.ScrollDownArrow className="flex h-6 items-center justify-center border-t border-gray-100 text-gray-400">
                    <ChevronDownIcon className="h-4 w-4" />
                  </SelectPrimitive.ScrollDownArrow>
                  <SelectPrimitive.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                    No foods found
                  </SelectPrimitive.Empty>
                </SelectPrimitive.Surface>
              </SelectPrimitive.Popup>
            </SelectPrimitive.Positioner>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </DemoCard>

      <ConfigPanel title="Current Selection">
        <div className="text-sm text-gray-600">
          <p>
            <strong>Value:</strong> {value || '(none)'}
          </p>
          <p>
            <strong>Group:</strong>{' '}
            {foodGroups.find((g) => g.items.some((i) => i.value === value))
              ?.label ?? 'N/A'}
          </p>
        </div>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Select Demo: Virtualized Select
// ============================================================================

function VirtualizedSelectDemo() {
  const [value, setValue] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [scrollElement, setScrollElement] =
    React.useState<HTMLDivElement | null>(null)
  const [itemCount, setItemCount] = React.useState(1000)

  // Generate items
  const allItems = React.useMemo(() => {
    const categories = ['User', 'Project', 'Task', 'Document', 'Event']
    const items: SelectVirtualItem[] = []
    for (let i = 0; i < itemCount; i++) {
      const category = categories[i % categories.length]
      items.push({
        value: `${category?.toLowerCase()}-${i + 1}`,
      })
    }
    return items
  }, [itemCount])

  // Filter items
  const filteredItems = React.useMemo(() => {
    if (!search) return allItems
    const lowerSearch = search.toLowerCase()
    return allItems.filter((item) => item.value.includes(lowerSearch))
  }, [search, allItems])

  const itemHeight = 36
  const listHeight = 300

  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => itemHeight,
    overscan: 5,
  })

  const virtualizerRef = React.useRef(virtualizer)
  virtualizerRef.current = virtualizer

  const handleHighlightChange = React.useCallback(
    (highlightedValue: string | null, index: number) => {
      if (index >= 0) {
        queueMicrotask(() => {
          virtualizerRef.current.scrollToIndex(index, { align: 'auto' })
        })
      }
    },
    [],
  )

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open && scrollElement) {
        scrollElement.scrollTop = 0
        setSearch('')
      }
    },
    [scrollElement],
  )

  return (
    <DemoSection
      title="Virtualized Select"
      description="Efficiently render thousands of items with virtualization"
    >
      <DemoCard>
        <div className="text-center">
          <div className="mb-2 text-xs text-gray-400">
            {filteredItems.length.toLocaleString()} items
          </div>
          <SelectPrimitive.Root
            value={value}
            onValueChange={setValue}
            virtualized
            virtualItems={filteredItems}
            onHighlightChange={handleHighlightChange}
            onOpenChange={handleOpenChange}
          >
            <SelectPrimitive.Trigger className="inline-flex min-w-[250px] items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 data-[placeholder]:text-gray-400">
              <SelectPrimitive.Value placeholder="Select an item..." />
              <SelectPrimitive.Icon className="text-gray-400 transition-transform data-[popup-open]:rotate-180">
                <ChevronDownIcon className="h-4 w-4" />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Positioner sideOffset={8}>
                <SelectPrimitive.Popup className="w-[300px] rounded-lg border border-gray-200 bg-white shadow-lg">
                  <SelectPrimitive.Surface
                    search={search}
                    onSearchChange={setSearch}
                    filter={false}
                  >
                    <div className="border-b border-gray-200 p-2">
                      <SelectPrimitive.Input
                        placeholder={`Search ${itemCount.toLocaleString()} items...`}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    <SelectPrimitive.List
                      ref={setScrollElement}
                      className="overflow-auto p-1 focus:outline-none scroll-py-1"
                      style={{ height: listHeight }}
                    >
                      <div
                        style={{
                          height: virtualizer.getTotalSize(),
                          width: '100%',
                          position: 'relative',
                        }}
                      >
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                          const item = filteredItems[virtualRow.index]
                          if (!item) return null
                          return (
                            <SelectPrimitive.Item
                              key={item.value}
                              value={item.value}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: itemHeight,
                                transform: `translateY(${virtualRow.start}px)`,
                              }}
                              className="flex cursor-pointer items-center justify-between rounded-md px-3 text-sm data-[highlighted]:bg-cyan-50"
                            >
                              <span className="capitalize">
                                {item.value.replace('-', ' #')}
                              </span>
                              <SelectPrimitive.ItemIndicator className="text-cyan-600">
                                <CheckIcon className="h-4 w-4" />
                              </SelectPrimitive.ItemIndicator>
                            </SelectPrimitive.Item>
                          )
                        })}
                      </div>
                    </SelectPrimitive.List>
                    <SelectPrimitive.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                      No items found
                    </SelectPrimitive.Empty>
                  </SelectPrimitive.Surface>
                </SelectPrimitive.Popup>
              </SelectPrimitive.Positioner>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        </div>
      </DemoCard>

      <ConfigPanel title="Virtualizer Config">
        <ConfigRow label="itemCount" description="Total number of items">
          <Select
            value={String(itemCount)}
            onChange={(v) => setItemCount(Number(v))}
            options={[
              { value: '100', label: '100' },
              { value: '1000', label: '1,000' },
              { value: '10000', label: '10,000' },
              { value: '50000', label: '50,000' },
            ]}
          />
        </ConfigRow>
      </ConfigPanel>

      <ConfigPanel title="How it works">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>virtualized prop:</strong> Enables virtualization mode
          </p>
          <p>
            <strong>items prop:</strong> Pre-registers items for keyboard nav
          </p>
          <p>
            <strong>onHighlightChange:</strong> Syncs scroll position
          </p>
          <p>
            <strong>filter=false:</strong> Consumer handles filtering
          </p>
        </div>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Select Demo: Form Integration
// ============================================================================

function FormIntegrationDemo() {
  const [submitted, setSubmitted] = React.useState<{
    country: string
    languages: string[]
  } | null>(null)

  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
  ]

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' },
  ]

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setSubmitted({
      country: formData.get('country') as string,
      languages: formData.getAll('languages') as string[],
    })
    toast.success('Form submitted!')
  }

  return (
    <DemoSection
      title="Form Integration"
      description="Select components with hidden inputs for native form submission"
    >
      <DemoCard>
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div className="space-y-2">
            <span
              id="country-label"
              className="block text-sm font-medium text-gray-700"
            >
              Country <span className="text-red-500">*</span>
            </span>
            <SelectPrimitive.Root name="country" required>
              <SelectPrimitive.Trigger className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 data-[placeholder]:text-gray-400">
                <SelectPrimitive.Value placeholder="Select country..." />
                <SelectPrimitive.Icon className="text-gray-400 transition-transform data-[popup-open]:rotate-180">
                  <ChevronDownIcon className="h-4 w-4" />
                </SelectPrimitive.Icon>
              </SelectPrimitive.Trigger>
              <SelectPrimitive.Portal>
                <SelectPrimitive.Positioner sideOffset={8}>
                  <SelectPrimitive.Popup className="min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg">
                    <SelectPrimitive.Surface>
                      <SelectPrimitive.Input
                        hideUntilActive
                        placeholder="Search countries..."
                        className="w-full border-b border-gray-200 px-3 py-2 text-sm outline-none focus:bg-gray-50"
                      />
                      <SelectPrimitive.List className="p-1 focus:outline-none">
                        {countries.map((c) => (
                          <SelectPrimitive.Item
                            key={c.value}
                            value={c.value}
                            textValue={c.label}
                            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                          >
                            <SelectPrimitive.ItemLabel>
                              {c.label}
                            </SelectPrimitive.ItemLabel>
                            <SelectPrimitive.ItemIndicator className="text-blue-600">
                              <CheckIcon className="h-4 w-4" />
                            </SelectPrimitive.ItemIndicator>
                          </SelectPrimitive.Item>
                        ))}
                      </SelectPrimitive.List>
                      <SelectPrimitive.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                        No countries found
                      </SelectPrimitive.Empty>
                    </SelectPrimitive.Surface>
                  </SelectPrimitive.Popup>
                </SelectPrimitive.Positioner>
              </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
          </div>

          <div className="space-y-2">
            <span
              id="languages-label"
              className="block text-sm font-medium text-gray-700"
            >
              Languages
            </span>
            <SelectPrimitive.Root name="languages" multiple>
              <SelectPrimitive.Trigger className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 data-[placeholder]:text-gray-400">
                <SelectPrimitive.Value placeholder="Select languages..." />
                <SelectPrimitive.Icon className="text-gray-400 transition-transform data-[popup-open]:rotate-180">
                  <ChevronDownIcon className="h-4 w-4" />
                </SelectPrimitive.Icon>
              </SelectPrimitive.Trigger>
              <SelectPrimitive.Portal>
                <SelectPrimitive.Positioner sideOffset={8}>
                  <SelectPrimitive.Popup className="min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg">
                    <SelectPrimitive.Surface>
                      <SelectPrimitive.Input
                        hideUntilActive
                        placeholder="Search languages..."
                        className="w-full border-b border-gray-200 px-3 py-2 text-sm outline-none focus:bg-gray-50"
                      />
                      <SelectPrimitive.List className="p-1 focus:outline-none">
                        {languages.map((lang) => (
                          <SelectPrimitive.Item
                            key={lang.value}
                            value={lang.value}
                            textValue={lang.label}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[highlighted]:bg-purple-50"
                          >
                            <span className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 data-[selected]:border-purple-600 data-[selected]:bg-purple-600">
                              <SelectPrimitive.ItemIndicator className="text-white">
                                <CheckIcon className="h-3 w-3" />
                              </SelectPrimitive.ItemIndicator>
                            </span>
                            <SelectPrimitive.ItemLabel>
                              {lang.label}
                            </SelectPrimitive.ItemLabel>
                          </SelectPrimitive.Item>
                        ))}
                      </SelectPrimitive.List>
                      <SelectPrimitive.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                        No languages found
                      </SelectPrimitive.Empty>
                    </SelectPrimitive.Surface>
                  </SelectPrimitive.Popup>
                </SelectPrimitive.Positioner>
              </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Submit
          </button>
        </form>
      </DemoCard>

      <ConfigPanel title="Submitted Data">
        {submitted ? (
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Country:</strong> {submitted.country}
            </p>
            <p>
              <strong>Languages:</strong>{' '}
              {submitted.languages.length > 0
                ? submitted.languages.join(', ')
                : '(none)'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Submit the form to see data</p>
        )}
      </ConfigPanel>

      <ConfigPanel title="Form Props">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>name:</strong> Field name for FormData
          </p>
          <p>
            <strong>required:</strong> HTML5 required validation
          </p>
          <p>
            <strong>form:</strong> Associate with form by ID
          </p>
          <p>
            <strong>Hidden inputs:</strong> Automatically rendered for
            submission
          </p>
        </div>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Demo: Context Menu
// ============================================================================

function ContextMenuDemo() {
  // State for demonstrating various features
  const [fontSize, setFontSize] = React.useState<'small' | 'medium' | 'large'>(
    'medium',
  )
  const [showLineNumbers, setShowLineNumbers] = React.useState(true)
  const [wordWrap, setWordWrap] = React.useState(false)
  const [minimap, setMinimap] = React.useState(true)
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>(
    'system',
  )

  return (
    <DemoSection
      title="Context Menu (Comprehensive)"
      description="Right-click to test inputs, multiple submenu levels, checkboxes, radio groups, disabled items, and more"
    >
      <DemoCard>
        <ContextMenu.Root>
          <ContextMenu.Trigger className="flex h-[250px] w-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-100">
            <div className="text-center">
              <div className="text-sm font-medium">Right-click here</div>
              <div className="text-xs text-gray-400">
                or long-press on touch
              </div>
              <div className="mt-4 space-y-1 text-xs text-gray-500">
                <div>Font: {fontSize}</div>
                <div>Theme: {theme}</div>
                <div>
                  Lines: {showLineNumbers ? 'on' : 'off'} | Wrap:{' '}
                  {wordWrap ? 'on' : 'off'} | Map: {minimap ? 'on' : 'off'}
                </div>
              </div>
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup className="min-w-[220px] rounded-lg border border-gray-200 bg-white shadow-lg">
                <ContextMenu.Surface>
                  {/* Search Input */}
                  <div className="border-b border-gray-200 p-2">
                    <ContextMenu.Input
                      placeholder="Search actions..."
                      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <ContextMenu.List className="max-h-[400px] overflow-y-auto p-1 focus:outline-none">
                    {/* Basic Actions Group */}
                    <ContextMenu.Group>
                      <ContextMenu.GroupLabel className="px-3 py-1.5 text-xs font-semibold text-gray-500">
                        Edit
                      </ContextMenu.GroupLabel>
                      <ContextMenu.Item
                        shortcut="x"
                        className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                        onSelect={() => toast('Cut')}
                      >
                        <span>Cut</span>
                        <ContextMenu.Shortcut className="text-xs text-gray-400" />
                      </ContextMenu.Item>
                      <ContextMenu.Item
                        shortcut="c"
                        className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                        onSelect={() => toast('Copy')}
                      >
                        <span>Copy</span>
                        <ContextMenu.Shortcut className="text-xs text-gray-400" />
                      </ContextMenu.Item>
                      <ContextMenu.Item
                        shortcut="v"
                        className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                        onSelect={() => toast('Paste')}
                      >
                        <span>Paste</span>
                        <ContextMenu.Shortcut className="text-xs text-gray-400" />
                      </ContextMenu.Item>
                      <ContextMenu.Item
                        disabled
                        className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-blue-50"
                      >
                        <span>Paste Special</span>
                        <span className="text-xs text-gray-400">
                          (disabled)
                        </span>
                      </ContextMenu.Item>
                    </ContextMenu.Group>

                    <ContextMenu.Separator className="my-1 h-px bg-gray-200" />

                    {/* View Settings - Checkboxes */}
                    <ContextMenu.Group>
                      <ContextMenu.GroupLabel className="px-3 py-1.5 text-xs font-semibold text-gray-500">
                        View Options
                      </ContextMenu.GroupLabel>
                      <ContextMenu.CheckboxItem
                        checked={showLineNumbers}
                        onCheckedChange={setShowLineNumbers}
                        closeOnClick={false}
                        className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                      >
                        <span>Line Numbers</span>
                        <ContextMenu.CheckboxItemIndicator className="flex h-4 w-4 items-center justify-center">
                          <CheckIcon className="h-4 w-4 text-blue-600" />
                        </ContextMenu.CheckboxItemIndicator>
                      </ContextMenu.CheckboxItem>
                      <ContextMenu.CheckboxItem
                        checked={wordWrap}
                        onCheckedChange={setWordWrap}
                        closeOnClick={false}
                        className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                      >
                        <span>Word Wrap</span>
                        <ContextMenu.CheckboxItemIndicator className="flex h-4 w-4 items-center justify-center">
                          <CheckIcon className="h-4 w-4 text-blue-600" />
                        </ContextMenu.CheckboxItemIndicator>
                      </ContextMenu.CheckboxItem>
                      <ContextMenu.CheckboxItem
                        checked={minimap}
                        onCheckedChange={setMinimap}
                        closeOnClick={false}
                        className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                      >
                        <span>Minimap</span>
                        <ContextMenu.CheckboxItemIndicator className="flex h-4 w-4 items-center justify-center">
                          <CheckIcon className="h-4 w-4 text-blue-600" />
                        </ContextMenu.CheckboxItemIndicator>
                      </ContextMenu.CheckboxItem>
                    </ContextMenu.Group>

                    <ContextMenu.Separator className="my-1 h-px bg-gray-200" />

                    {/* Font Size - Radio Group */}
                    <ContextMenu.Group>
                      <ContextMenu.GroupLabel className="px-3 py-1.5 text-xs font-semibold text-gray-500">
                        Font Size
                      </ContextMenu.GroupLabel>
                      <ContextMenu.RadioGroup
                        value={fontSize}
                        onValueChange={setFontSize}
                      >
                        <ContextMenu.RadioItem
                          value="small"
                          className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                        >
                          <span>Small</span>
                          <ContextMenu.RadioItemIndicator className="flex h-4 w-4 items-center justify-center">
                            <CheckIcon className="h-4 w-4 text-blue-600" />
                          </ContextMenu.RadioItemIndicator>
                        </ContextMenu.RadioItem>
                        <ContextMenu.RadioItem
                          value="medium"
                          className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                        >
                          <span>Medium</span>
                          <ContextMenu.RadioItemIndicator className="flex h-4 w-4 items-center justify-center">
                            <CheckIcon className="h-4 w-4 text-blue-600" />
                          </ContextMenu.RadioItemIndicator>
                        </ContextMenu.RadioItem>
                        <ContextMenu.RadioItem
                          value="large"
                          className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                        >
                          <span>Large</span>
                          <ContextMenu.RadioItemIndicator className="flex h-4 w-4 items-center justify-center">
                            <CheckIcon className="h-4 w-4 text-blue-600" />
                          </ContextMenu.RadioItemIndicator>
                        </ContextMenu.RadioItem>
                      </ContextMenu.RadioGroup>
                    </ContextMenu.Group>

                    <ContextMenu.Separator className="my-1 h-px bg-gray-200" />

                    {/* Theme Submenu - Level 1 */}
                    <ContextMenu.Submenu>
                      <ContextMenu.SubmenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50">
                        <span>Theme</span>
                        <ContextMenu.SubmenuTriggerIndicator className="text-gray-400">
                          <CaretRightIcon className="h-4 w-4" />
                        </ContextMenu.SubmenuTriggerIndicator>
                      </ContextMenu.SubmenuTrigger>
                      <ContextMenu.Portal>
                        <ContextMenu.Positioner sideOffset={4}>
                          <ContextMenu.Popup className="min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg">
                            <ContextMenu.Surface>
                              <ContextMenu.List className="p-1 focus:outline-none">
                                <ContextMenu.RadioGroup
                                  value={theme}
                                  onValueChange={setTheme}
                                >
                                  <ContextMenu.RadioItem
                                    value="light"
                                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                  >
                                    <span>Light</span>
                                    <ContextMenu.RadioItemIndicator className="flex h-4 w-4 items-center justify-center">
                                      <CheckIcon className="h-4 w-4 text-blue-600" />
                                    </ContextMenu.RadioItemIndicator>
                                  </ContextMenu.RadioItem>
                                  <ContextMenu.RadioItem
                                    value="dark"
                                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                  >
                                    <span>Dark</span>
                                    <ContextMenu.RadioItemIndicator className="flex h-4 w-4 items-center justify-center">
                                      <CheckIcon className="h-4 w-4 text-blue-600" />
                                    </ContextMenu.RadioItemIndicator>
                                  </ContextMenu.RadioItem>
                                  <ContextMenu.RadioItem
                                    value="system"
                                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                  >
                                    <span>System</span>
                                    <ContextMenu.RadioItemIndicator className="flex h-4 w-4 items-center justify-center">
                                      <CheckIcon className="h-4 w-4 text-blue-600" />
                                    </ContextMenu.RadioItemIndicator>
                                  </ContextMenu.RadioItem>
                                </ContextMenu.RadioGroup>

                                <ContextMenu.Separator className="my-1 h-px bg-gray-200" />

                                {/* Color Scheme Submenu - Level 2 */}
                                <ContextMenu.Submenu>
                                  <ContextMenu.SubmenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50">
                                    <span>Color Schemes</span>
                                    <ContextMenu.SubmenuTriggerIndicator className="text-gray-400">
                                      <CaretRightIcon className="h-4 w-4" />
                                    </ContextMenu.SubmenuTriggerIndicator>
                                  </ContextMenu.SubmenuTrigger>
                                  <ContextMenu.Portal>
                                    <ContextMenu.Positioner sideOffset={4}>
                                      <ContextMenu.Popup className="min-w-[160px] rounded-lg border border-gray-200 bg-white shadow-lg">
                                        <ContextMenu.Surface>
                                          <ContextMenu.List className="p-1 focus:outline-none">
                                            <ContextMenu.Item
                                              className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                              onSelect={() =>
                                                toast('Default scheme')
                                              }
                                            >
                                              Default
                                            </ContextMenu.Item>
                                            <ContextMenu.Item
                                              className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                              onSelect={() =>
                                                toast('Monokai scheme')
                                              }
                                            >
                                              Monokai
                                            </ContextMenu.Item>
                                            <ContextMenu.Item
                                              className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                              onSelect={() =>
                                                toast('Solarized scheme')
                                              }
                                            >
                                              Solarized
                                            </ContextMenu.Item>

                                            <ContextMenu.Separator className="my-1 h-px bg-gray-200" />

                                            {/* Custom Colors Submenu - Level 3 */}
                                            <ContextMenu.Submenu>
                                              <ContextMenu.SubmenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50">
                                                <span>Custom</span>
                                                <ContextMenu.SubmenuTriggerIndicator className="text-gray-400">
                                                  <CaretRightIcon className="h-4 w-4" />
                                                </ContextMenu.SubmenuTriggerIndicator>
                                              </ContextMenu.SubmenuTrigger>
                                              <ContextMenu.Portal>
                                                <ContextMenu.Positioner
                                                  sideOffset={4}
                                                >
                                                  <ContextMenu.Popup className="min-w-[140px] rounded-lg border border-gray-200 bg-white shadow-lg">
                                                    <ContextMenu.Surface>
                                                      <ContextMenu.List className="p-1 focus:outline-none">
                                                        <ContextMenu.Item
                                                          className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                                          onSelect={() =>
                                                            toast(
                                                              'Nord selected',
                                                            )
                                                          }
                                                        >
                                                          Nord
                                                        </ContextMenu.Item>
                                                        <ContextMenu.Item
                                                          className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                                          onSelect={() =>
                                                            toast(
                                                              'Dracula selected',
                                                            )
                                                          }
                                                        >
                                                          Dracula
                                                        </ContextMenu.Item>
                                                        <ContextMenu.Item
                                                          className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                                          onSelect={() =>
                                                            toast(
                                                              'One Dark selected',
                                                            )
                                                          }
                                                        >
                                                          One Dark
                                                        </ContextMenu.Item>
                                                        <ContextMenu.Item
                                                          className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                                          onSelect={() =>
                                                            toast(
                                                              'GitHub selected',
                                                            )
                                                          }
                                                        >
                                                          GitHub
                                                        </ContextMenu.Item>

                                                        <ContextMenu.Separator className="my-1 h-px bg-gray-200" />

                                                        {/* Level 4 - Deep nesting test */}
                                                        <ContextMenu.Submenu>
                                                          <ContextMenu.SubmenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50">
                                                            <span>More...</span>
                                                            <ContextMenu.SubmenuTriggerIndicator className="text-gray-400">
                                                              <CaretRightIcon className="h-4 w-4" />
                                                            </ContextMenu.SubmenuTriggerIndicator>
                                                          </ContextMenu.SubmenuTrigger>
                                                          <ContextMenu.Portal>
                                                            <ContextMenu.Positioner
                                                              sideOffset={4}
                                                            >
                                                              <ContextMenu.Popup className="min-w-[120px] rounded-lg border border-gray-200 bg-white shadow-lg">
                                                                <ContextMenu.Surface>
                                                                  <ContextMenu.List className="p-1 focus:outline-none">
                                                                    <ContextMenu.Item
                                                                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                                                      onSelect={() =>
                                                                        toast(
                                                                          'Ayu selected',
                                                                        )
                                                                      }
                                                                    >
                                                                      Ayu
                                                                    </ContextMenu.Item>
                                                                    <ContextMenu.Item
                                                                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                                                      onSelect={() =>
                                                                        toast(
                                                                          'Gruvbox selected',
                                                                        )
                                                                      }
                                                                    >
                                                                      Gruvbox
                                                                    </ContextMenu.Item>
                                                                    <ContextMenu.Item
                                                                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                                                      onSelect={() =>
                                                                        toast(
                                                                          'Tokyo Night selected',
                                                                        )
                                                                      }
                                                                    >
                                                                      Tokyo
                                                                      Night
                                                                    </ContextMenu.Item>
                                                                  </ContextMenu.List>
                                                                </ContextMenu.Surface>
                                                              </ContextMenu.Popup>
                                                            </ContextMenu.Positioner>
                                                          </ContextMenu.Portal>
                                                        </ContextMenu.Submenu>
                                                      </ContextMenu.List>
                                                    </ContextMenu.Surface>
                                                  </ContextMenu.Popup>
                                                </ContextMenu.Positioner>
                                              </ContextMenu.Portal>
                                            </ContextMenu.Submenu>
                                          </ContextMenu.List>
                                        </ContextMenu.Surface>
                                      </ContextMenu.Popup>
                                    </ContextMenu.Positioner>
                                  </ContextMenu.Portal>
                                </ContextMenu.Submenu>
                              </ContextMenu.List>
                            </ContextMenu.Surface>
                          </ContextMenu.Popup>
                        </ContextMenu.Positioner>
                      </ContextMenu.Portal>
                    </ContextMenu.Submenu>

                    {/* Share Submenu with search */}
                    <ContextMenu.Submenu>
                      <ContextMenu.SubmenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50">
                        <span>Share</span>
                        <ContextMenu.SubmenuTriggerIndicator className="text-gray-400">
                          <CaretRightIcon className="h-4 w-4" />
                        </ContextMenu.SubmenuTriggerIndicator>
                      </ContextMenu.SubmenuTrigger>
                      <ContextMenu.Portal>
                        <ContextMenu.Positioner sideOffset={4}>
                          <ContextMenu.Popup className="min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg">
                            <ContextMenu.Surface>
                              <div className="border-b border-gray-200 p-2">
                                <ContextMenu.Input
                                  placeholder="Search shares..."
                                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <ContextMenu.List className="p-1 focus:outline-none">
                                <ContextMenu.Item
                                  value="email"
                                  keywords={['mail', 'send']}
                                  className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                  onSelect={() => toast('Share via Email')}
                                >
                                  Email
                                </ContextMenu.Item>
                                <ContextMenu.Item
                                  value="slack"
                                  keywords={['message', 'chat']}
                                  className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                  onSelect={() => toast('Share via Slack')}
                                >
                                  Slack
                                </ContextMenu.Item>
                                <ContextMenu.Item
                                  value="discord"
                                  keywords={['message', 'chat', 'gaming']}
                                  className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                  onSelect={() => toast('Share via Discord')}
                                >
                                  Discord
                                </ContextMenu.Item>
                                <ContextMenu.Item
                                  value="teams"
                                  keywords={['microsoft', 'message']}
                                  className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                  onSelect={() => toast('Share via Teams')}
                                >
                                  Microsoft Teams
                                </ContextMenu.Item>
                                <ContextMenu.Separator className="my-1 h-px bg-gray-200" />
                                <ContextMenu.Item
                                  value="link"
                                  keywords={['copy', 'url']}
                                  className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                                  onSelect={() => toast('Link copied!')}
                                >
                                  Copy Link
                                </ContextMenu.Item>
                              </ContextMenu.List>
                              <ContextMenu.Empty className="px-3 py-4 text-center text-sm text-gray-500">
                                No share options found
                              </ContextMenu.Empty>
                            </ContextMenu.Surface>
                          </ContextMenu.Popup>
                        </ContextMenu.Positioner>
                      </ContextMenu.Portal>
                    </ContextMenu.Submenu>

                    <ContextMenu.Separator className="my-1 h-px bg-gray-200" />

                    {/* Actions */}
                    <ContextMenu.Item
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                      onSelect={() => toast('Refreshed!')}
                    >
                      Refresh
                    </ContextMenu.Item>
                    <ContextMenu.Item
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                      onSelect={() => toast('Duplicated!')}
                    >
                      Duplicate
                    </ContextMenu.Item>

                    <ContextMenu.Separator className="my-1 h-px bg-gray-200" />

                    {/* Danger Zone */}
                    <ContextMenu.Item
                      className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 data-[highlighted]:bg-red-50"
                      onSelect={() => toast('Deleted!')}
                    >
                      Delete
                    </ContextMenu.Item>
                  </ContextMenu.List>

                  <ContextMenu.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                    No actions found
                  </ContextMenu.Empty>
                </ContextMenu.Surface>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      </DemoCard>

      <ConfigPanel title="Features Demonstrated">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Search Input:</strong> Type to filter menu items
          </p>
          <p>
            <strong>Groups & Labels:</strong> Organized sections with headers
          </p>
          <p>
            <strong>Checkbox Items:</strong> Toggle settings without closing
          </p>
          <p>
            <strong>Radio Groups:</strong> Single selection (font size)
          </p>
          <p>
            <strong>Disabled Items:</strong> "Paste Special" is disabled
          </p>
          <p>
            <strong>Keyboard Shortcuts:</strong> Press x/c/v to trigger actions
          </p>
          <p>
            <strong>Submenus (4 levels):</strong> Theme → Color Schemes → Custom
            → More
          </p>
          <p>
            <strong>Submenu with Search:</strong> Share submenu has its own
            filter
          </p>
        </div>
      </ConfigPanel>

      <ConfigPanel title="Current State">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Font Size:</strong> {fontSize}
          </p>
          <p>
            <strong>Theme:</strong> {theme}
          </p>
          <p>
            <strong>Line Numbers:</strong> {showLineNumbers ? 'On' : 'Off'}
          </p>
          <p>
            <strong>Word Wrap:</strong> {wordWrap ? 'On' : 'Off'}
          </p>
          <p>
            <strong>Minimap:</strong> {minimap ? 'On' : 'Off'}
          </p>
        </div>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Demo: Virtualization
// ============================================================================

function VirtualizationDemo() {
  const [search, setSearch] = React.useState('')
  const [scrollElement, setScrollElement] =
    React.useState<HTMLDivElement | null>(null)

  // Config state - DropdownMenu
  const [loop, setLoop] = React.useState(true)
  const [autoHighlightFirst, setAutoHighlightFirst] = React.useState(true)

  // Config state - Virtualizer
  const [overscan, setOverscan] = React.useState(5)
  const [itemHeight, setItemHeight] = React.useState(36)
  const [listHeight, setListHeight] = React.useState(300)
  const [itemCount, setItemCount] = React.useState(10000)

  // Generate items based on count
  const allItems = React.useMemo(() => {
    const categories = [
      'User',
      'Project',
      'Task',
      'Document',
      'Event',
      'Report',
    ]
    const items: DropdownMenuVirtualItem[] = []

    for (let i = 0; i < itemCount; i++) {
      const category = categories[i % categories.length]
      items.push({
        value: `${category} ${i + 1}`,
        // keywords: [category?.toLowerCase() ?? '', `item-${i}`],
      })
    }

    return items
  }, [itemCount])

  // Filter items based on search
  const filteredItems = React.useMemo(() => {
    if (!search) return allItems
    const lowerSearch = search.toLowerCase()
    return allItems.filter(
      (item) =>
        item.value.toLowerCase().includes(lowerSearch) ||
        item.keywords?.some((k) => k.includes(lowerSearch)),
    )
  }, [search, allItems])

  // Scroll padding (matches scroll-py-1 = 0.25rem = 4px)
  const scrollPadding = 4

  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => itemHeight,
    overscan,
    scrollPaddingStart: scrollPadding,
    scrollPaddingEnd: scrollPadding,
  })

  // Use a ref to avoid stale closure issues with the virtualizer
  const virtualizerRef = React.useRef(virtualizer)
  virtualizerRef.current = virtualizer

  // Sync highlighted item with virtualizer when item is not in DOM.
  // This callback is only called when the item is virtualized out of view,
  // so we need to scroll it into view via the virtualizer.
  const handleHighlightChange = React.useCallback(
    (value: string | null, index: number) => {
      if (index < 0 || !value) return

      // Find the first and last navigable (non-disabled) items
      const firstNavigableValue = filteredItems.find(
        (item) => !item.disabled,
      )?.value
      const lastNavigableValue = [...filteredItems]
        .reverse()
        .find((item) => !item.disabled)?.value

      const isStart = value === firstNavigableValue
      const isEnd = value === lastNavigableValue

      // Use queueMicrotask to ensure DOM is ready before scrolling
      queueMicrotask(() => {
        if (isStart || isEnd) {
          // For start/end positions (including loop jumps), use inverted alignment
          // to ensure scroll padding is respected:
          // - At end: use 'start' to put item at top, leaving room at bottom
          // - At start: use 'end' to put item at bottom, leaving room at top
          virtualizerRef.current.scrollToIndex(index, {
            align: isEnd ? 'start' : 'end',
          })
        } else {
          // Normal navigation - use auto alignment
          virtualizerRef.current.scrollToIndex(index, { align: 'auto' })
        }
      })
    },
    [filteredItems],
  )

  // Reset scroll position when menu closes
  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open && scrollElement) {
        scrollElement.scrollTop = 0
      }
    },
    [scrollElement],
  )

  return (
    <DemoSection
      title="Virtualization"
      description="Render 10,000 items efficiently with @tanstack/react-virtual"
    >
      <DemoCard>
        <div className="text-center">
          <div className="mb-2 text-xs text-gray-400">
            {filteredItems.length.toLocaleString()} items
          </div>
          <DropdownMenu.Root
            virtualized
            items={filteredItems}
            onHighlightChange={handleHighlightChange}
            onOpenChange={handleOpenChange}
          >
            <DropdownMenu.Trigger className="rounded-md bg-violet-600 px-4 py-2 text-white hover:bg-violet-500">
              Select Item
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner sideOffset={8}>
                <DropdownMenu.Popup className="w-[300px] rounded-lg border border-gray-200 bg-white shadow-lg">
                  <DropdownMenu.Surface
                    search={search}
                    onSearchChange={setSearch}
                    loop={loop}
                    autoHighlightFirst={autoHighlightFirst}
                    filter={false}
                  >
                    <div className="border-b border-gray-200 p-2">
                      <DropdownMenu.Input
                        placeholder="Search 10,000 items..."
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                      />
                    </div>
                    <DropdownMenu.List
                      ref={setScrollElement}
                      className="overflow-auto p-1 focus:outline-none scroll-py-1"
                      style={{ height: listHeight }}
                    >
                      <div
                        style={{
                          height: virtualizer.getTotalSize(),
                          width: '100%',
                          position: 'relative',
                        }}
                      >
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                          const item = filteredItems[virtualRow.index]
                          if (!item) return null

                          return (
                            <DropdownMenu.Item
                              key={item.value}
                              value={item.value}
                              disabled={item.disabled}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: itemHeight,
                                transform: `translateY(${virtualRow.start}px)`,
                              }}
                              className={cn(
                                'flex cursor-pointer items-center rounded-md px-3 text-sm',
                                'data-[highlighted]:bg-violet-50',
                                'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
                              )}
                              onSelect={() => toast(`Selected: ${item.value}`)}
                            >
                              {item.value}
                              {item.disabled && (
                                <span className="ml-auto text-xs text-gray-400">
                                  disabled
                                </span>
                              )}
                            </DropdownMenu.Item>
                          )
                        })}
                      </div>
                    </DropdownMenu.List>
                    <DropdownMenu.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                      No items found
                    </DropdownMenu.Empty>
                  </DropdownMenu.Surface>
                </DropdownMenu.Popup>
              </DropdownMenu.Positioner>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </DemoCard>

      <ConfigPanel title="DropdownMenu Props">
        <ConfigRow
          label="loop"
          description="Loop navigation from last to first"
        >
          <Toggle checked={loop} onChange={setLoop} />
        </ConfigRow>
        <ConfigRow
          label="autoHighlightFirst"
          description="Auto-highlight first item on open/search"
        >
          <Toggle
            checked={autoHighlightFirst}
            onChange={setAutoHighlightFirst}
          />
        </ConfigRow>
      </ConfigPanel>

      <ConfigPanel title="Virtualizer Config">
        <ConfigRow
          label="itemCount"
          description="Total number of items to generate"
        >
          <Select
            value={String(itemCount)}
            onChange={(v) => setItemCount(Number(v))}
            options={[
              { value: '100', label: '100' },
              { value: '1000', label: '1,000' },
              { value: '10000', label: '10,000' },
              { value: '50000', label: '50,000' },
              { value: '100000', label: '100,000' },
            ]}
          />
        </ConfigRow>
        <ConfigRow
          label="overscan"
          description="Extra items rendered outside viewport"
        >
          <NumberInput
            value={overscan}
            onChange={setOverscan}
            min={0}
            max={50}
          />
        </ConfigRow>
        <ConfigRow label="itemHeight" description="Height of each item (px)">
          <NumberInput
            value={itemHeight}
            onChange={setItemHeight}
            min={20}
            max={80}
          />
        </ConfigRow>
        <ConfigRow
          label="listHeight"
          description="Height of scroll container (px)"
        >
          <NumberInput
            value={listHeight}
            onChange={setListHeight}
            min={100}
            max={600}
            step={50}
          />
        </ConfigRow>
      </ConfigPanel>

      <ConfigPanel title="How it works">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>1. Pass items to Root:</strong> The{' '}
            <code className="rounded bg-gray-100 px-1">items</code> prop
            pre-registers all items so keyboard navigation works for unmounted
            items.
          </p>
          <p>
            <strong>2. Enable virtualization:</strong> Set{' '}
            <code className="rounded bg-gray-100 px-1">virtualized</code> to
            skip internal scroll-into-view behavior.
          </p>
          <p>
            <strong>3. Sync scroll position:</strong> Use{' '}
            <code className="rounded bg-gray-100 px-1">onHighlightChange</code>{' '}
            to call{' '}
            <code className="rounded bg-gray-100 px-1">scrollToIndex</code> when
            navigating with keyboard.
          </p>
          <p>
            <strong>4. Correlate items:</strong> The{' '}
            <code className="rounded bg-gray-100 px-1">value</code> prop on each
            Item matches the value in the pre-registered items array.
          </p>
        </div>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Demo 0: Keyboard Shortcuts
// ============================================================================

function KeyboardShortcutsDemo() {
  const [status, setStatus] = React.useState<string>('backlog')

  const statuses = [
    {
      value: 'icebox',
      label: 'Icebox',
      shortcut: '1',
      icon: StatusIcons.Icebox,
    },
    {
      value: 'backlog',
      label: 'Backlog',
      shortcut: '2',
      icon: StatusIcons.Backlog,
    },
    { value: 'todo', label: 'Todo', shortcut: '3', icon: StatusIcons.Todo },
    {
      value: 'inprogress',
      label: 'In Progress',
      shortcut: '4',
      icon: StatusIcons.InProgress,
    },
    { value: 'done', label: 'Done', shortcut: '5', icon: StatusIcons.Done },
  ]

  const currentStatus = statuses.find((s) => s.value === status)

  return (
    <DemoSection
      title="Keyboard Shortcuts"
      description="Press number keys (1-5) to quickly select a status when the menu is open"
    >
      <DemoCard>
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-xs text-gray-400">
            Current: {currentStatus && <currentStatus.icon />}{' '}
            {currentStatus?.label}
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-500">
              {currentStatus && <currentStatus.icon />}
              <span>{currentStatus?.label ?? 'Select status'}</span>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner sideOffset={8}>
                <DropdownMenu.Popup className="min-w-[220px] rounded-lg border border-gray-200 bg-white shadow-lg">
                  <DropdownMenu.Surface>
                    <DropdownMenu.Input
                      placeholder="Change status..."
                      className={cn(
                        'outline-hidden disabled:cursor-not-allowed disabled:opacity-50 min-h-10 max-h-10 px-4 border-b text-sm',
                        'placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out',
                        'caret-blue-500',
                        'w-full',
                      )}
                    />
                    <DropdownMenu.List className="p-1 focus:outline-none">
                      {statuses.map((s) => (
                        <DropdownMenu.Item
                          key={s.value}
                          shortcut={s.shortcut}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[highlighted]:bg-purple-50"
                          onSelect={() => {
                            setStatus(s.value)
                            toast(`Status changed to ${s.label}`)
                          }}
                        >
                          <s.icon />
                          <span className="flex-1">{s.label}</span>
                          {status === s.value && (
                            <CheckIcon className="h-4 w-4 text-purple-600" />
                          )}
                          <DropdownMenu.Shortcut
                            className="text-xs text-gray-400"
                            render={(props, state) => (
                              <span {...props}>{state.shortcut}</span>
                            )}
                          />
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.Popup>
              </DropdownMenu.Positioner>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </DemoCard>

      <ConfigPanel title="How it works">
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            Each item has a{' '}
            <code className="rounded bg-gray-100 px-1">shortcut</code> prop that
            registers a keyboard shortcut.
          </p>
          <p className="mb-2">
            When the menu is open and focused, pressing the shortcut key (1-5)
            will immediately select that item.
          </p>
          <p>
            The{' '}
            <code className="rounded bg-gray-100 px-1">
              &lt;DropdownMenu.Shortcut /&gt;
            </code>{' '}
            component automatically displays the shortcut value.
          </p>
        </div>
      </ConfigPanel>
    </DemoSection>
  )
}

// Status icons for keyboard shortcuts demo
const StatusIcons = {
  Icebox: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle
        cx="7"
        cy="7"
        r="6"
        fill="none"
        stroke="#26b5ce"
        strokeWidth="1.5"
        strokeDasharray="1.4 1.74"
        strokeDashoffset="0.65"
      />
    </svg>
  ),
  Backlog: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle
        cx="7"
        cy="7"
        r="6"
        fill="none"
        stroke="#8a8f98"
        strokeWidth="1.5"
        strokeDasharray="1.4 1.74"
        strokeDashoffset="0.65"
      />
    </svg>
  ),
  Todo: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle
        cx="7"
        cy="7"
        r="6"
        fill="none"
        strokeWidth="1.5"
        stroke="#8a8f98"
      />
    </svg>
  ),
  InProgress: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle
        cx="7"
        cy="7"
        r="6"
        fill="none"
        stroke="#f5a623"
        strokeWidth="1.5"
      />
      <circle
        cx="7"
        cy="7"
        r="3"
        fill="none"
        stroke="#f5a623"
        strokeWidth="6"
        strokeDasharray="9.42 18.84"
        transform="rotate(-90 7 7)"
      />
    </svg>
  ),
  Done: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" fill="#5e6ad2" stroke="none" />
      <path
        d="M10.2 4.8L5.95 9.05L3.8 6.9"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
}

// ============================================================================
// Demo 1: Surface & Search
// ============================================================================

function SurfaceSearchDemo() {
  // Config state
  const [loop, setLoop] = React.useState(true)
  const [autoHighlightFirst, setAutoHighlightFirst] = React.useState(true)
  const [clearSearchOnClose, setClearSearchOnClose] = React.useState(true)
  const [hideUntilActive, setHideUntilActive] = React.useState(false)
  const [filterEnabled, setFilterEnabled] = React.useState(true)

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
    <DemoSection
      title="Surface & Search"
      description="Configure search behavior, filtering, and navigation options"
    >
      <DemoCard>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500">
            Select Fruit
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner sideOffset={8}>
              <DropdownMenu.Popup className="min-w-[220px] rounded-lg border border-gray-200 bg-white shadow-lg">
                <DropdownMenu.Surface
                  loop={loop}
                  autoHighlightFirst={autoHighlightFirst}
                  clearSearchOnClose={clearSearchOnClose}
                  filter={filterEnabled ? undefined : false}
                >
                  <DropdownMenu.Input
                    hideUntilActive={hideUntilActive}
                    placeholder="Search fruits..."
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    render={(props, state) => (
                      <div
                        className={cn(
                          'border-b border-gray-200 p-2',
                          hideUntilActive && !state.active && 'hidden',
                        )}
                      >
                        <input {...props} />
                      </div>
                    )}
                  />
                  <DropdownMenu.List className="max-h-[200px] overflow-y-auto scroll-py-1 p-1">
                    {({ search, filteredCount }) => (
                      <>
                        {search && (
                          <div className="px-3 py-1 text-xs text-gray-400">
                            {filteredCount} result
                            {filteredCount !== 1 ? 's' : ''}
                          </div>
                        )}
                        {fruits.map((fruit) => (
                          <DropdownMenu.Item
                            key={fruit.value}
                            value={fruit.value}
                            keywords={fruit.keywords}
                            className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-blue-50"
                            onSelect={() => toast(`Selected: ${fruit.label}`)}
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
      </DemoCard>

      <ConfigPanel title="Surface Props">
        <ConfigRow
          label="loop"
          description="Loop navigation from last to first"
        >
          <Toggle checked={loop} onChange={setLoop} />
        </ConfigRow>
        <ConfigRow
          label="autoHighlightFirst"
          description="Auto-highlight first item on open/search"
        >
          <Toggle
            checked={autoHighlightFirst}
            onChange={setAutoHighlightFirst}
          />
        </ConfigRow>
        <ConfigRow
          label="clearSearchOnClose"
          description="Clear search when menu closes"
        >
          <Toggle
            checked={clearSearchOnClose}
            onChange={setClearSearchOnClose}
          />
        </ConfigRow>
        <ConfigRow label="filter" description="Enable fuzzy filtering">
          <Toggle checked={filterEnabled} onChange={setFilterEnabled} />
        </ConfigRow>
      </ConfigPanel>

      <ConfigPanel title="Input Props">
        <ConfigRow
          label="hideUntilActive"
          description="Hide input until user types"
        >
          <Toggle checked={hideUntilActive} onChange={setHideUntilActive} />
        </ConfigRow>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Demo 2: Positioning
// ============================================================================

function PositioningDemo() {
  // Config state
  const [side, setSide] = React.useState<'top' | 'bottom' | 'left' | 'right'>(
    'bottom',
  )
  const [align, setAlign] = React.useState<'start' | 'center' | 'end'>('center')
  const [sideOffset, setSideOffset] = React.useState(8)
  const [showArrow, setShowArrow] = React.useState(false)
  const [showBackdrop, setShowBackdrop] = React.useState(false)

  return (
    <DemoSection
      title="Positioning"
      description="Control where and how the dropdown appears relative to the trigger"
    >
      <DemoCard>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500">
            Positioned Menu
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            {showBackdrop && (
              <DropdownMenu.Backdrop className="fixed inset-0 bg-black/20 pointer-events-none" />
            )}
            <DropdownMenu.Positioner
              side={side}
              align={align}
              sideOffset={sideOffset}
            >
              <DropdownMenu.Popup className="relative min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg">
                {showArrow && (
                  <DropdownMenu.Arrow className="data-[side=bottom]:top-[-8px] data-[side=top]:bottom-[-8px] data-[side=left]:right-[-8px] data-[side=right]:left-[-8px]">
                    <ArrowSvg />
                  </DropdownMenu.Arrow>
                )}
                <DropdownMenu.Surface>
                  <DropdownMenu.List className="p-1 focus:outline-none">
                    <DropdownMenu.Item
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-emerald-50"
                      onSelect={() => toast('Profile')}
                    >
                      Profile
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-emerald-50"
                      onSelect={() => toast('Settings')}
                    >
                      Settings
                    </DropdownMenu.Item>
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
      </DemoCard>

      <ConfigPanel title="Positioner Props">
        <ConfigRow label="side" description="Which side of the trigger">
          <Select
            value={side}
            onChange={setSide}
            options={[
              { value: 'top', label: 'top' },
              { value: 'bottom', label: 'bottom' },
              { value: 'left', label: 'left' },
              { value: 'right', label: 'right' },
            ]}
          />
        </ConfigRow>
        <ConfigRow label="align" description="Alignment along the side">
          <Select
            value={align}
            onChange={setAlign}
            options={[
              { value: 'start', label: 'start' },
              { value: 'center', label: 'center' },
              { value: 'end', label: 'end' },
            ]}
          />
        </ConfigRow>
        <ConfigRow label="sideOffset" description="Distance from trigger (px)">
          <NumberInput
            value={sideOffset}
            onChange={setSideOffset}
            min={0}
            max={50}
          />
        </ConfigRow>
      </ConfigPanel>

      <ConfigPanel title="Visual Props">
        <ConfigRow label="Arrow" description="Show pointer arrow">
          <Toggle checked={showArrow} onChange={setShowArrow} />
        </ConfigRow>
        <ConfigRow label="Backdrop" description="Show backdrop overlay">
          <Toggle checked={showBackdrop} onChange={setShowBackdrop} />
        </ConfigRow>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Demo 3: Selections (Radio & Checkbox)
// ============================================================================

function SelectionsDemo() {
  // Radio state
  const [sortBy, setSortBy] = React.useState<'name' | 'date' | 'size'>('name')

  // Checkbox state
  const [notifications, setNotifications] = React.useState(true)
  const [darkMode, setDarkMode] = React.useState(false)
  const [autoSave, setAutoSave] = React.useState(true)

  // Config
  const [closeCheckboxOnClick, setCloseCheckboxOnClick] = React.useState(false)
  const [useCustomCheckbox, setUseCustomCheckbox] = React.useState(false)

  return (
    <DemoSection
      title="Selections"
      description="RadioGroup for single selection, CheckboxItem for multiple selections"
    >
      {/* Radio Demo */}
      <DemoCard>
        <div className="text-center">
          <div className="mb-2 text-xs text-gray-400">Sort: {sortBy}</div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500">
              Sort by: {sortBy}
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner sideOffset={8}>
                <DropdownMenu.Popup className="min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg">
                  <DropdownMenu.Surface>
                    <DropdownMenu.List className="p-1 focus:outline-none">
                      <DropdownMenu.RadioGroup
                        value={sortBy}
                        onValueChange={setSortBy}
                      >
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
      </DemoCard>

      {/* Checkbox Demo */}
      <DemoCard>
        <div className="text-center">
          <div className="mb-2 text-xs text-gray-400">
            N: {notifications ? 'on' : 'off'} | D: {darkMode ? 'on' : 'off'} |
            A: {autoSave ? 'on' : 'off'}
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-500">
              Settings
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner sideOffset={8}>
                <DropdownMenu.Popup className="min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg">
                  <DropdownMenu.Surface>
                    <DropdownMenu.List className="p-1 focus:outline-none">
                      {useCustomCheckbox ? (
                        // Custom checkbox rendering using Checkbox UI component
                        <>
                          <DropdownMenu.CheckboxItem
                            checked={notifications}
                            onCheckedChange={setNotifications}
                            closeOnClick={closeCheckboxOnClick}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[highlighted]:bg-teal-50"
                          >
                            <DropdownMenu.CheckboxItemIndicator
                              keepMounted
                              render={(props, state) => (
                                <Checkbox
                                  checked={state.checked}
                                  tabIndex={-1}
                                  onClick={
                                    closeCheckboxOnClick
                                      ? (e) => {
                                          e.stopPropagation()
                                          state.toggle()
                                        }
                                      : undefined
                                  }
                                />
                              )}
                            />
                            <span>Notifications</span>
                          </DropdownMenu.CheckboxItem>
                          <DropdownMenu.CheckboxItem
                            checked={darkMode}
                            onCheckedChange={setDarkMode}
                            closeOnClick={closeCheckboxOnClick}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[highlighted]:bg-teal-50"
                          >
                            <DropdownMenu.CheckboxItemIndicator
                              keepMounted
                              render={(props, state) => (
                                <Checkbox
                                  checked={state.checked}
                                  tabIndex={-1}
                                  onClick={
                                    closeCheckboxOnClick
                                      ? (e) => {
                                          e.stopPropagation()
                                          state.toggle()
                                        }
                                      : undefined
                                  }
                                />
                              )}
                            />
                            <span>Dark Mode</span>
                          </DropdownMenu.CheckboxItem>
                          <DropdownMenu.CheckboxItem
                            checked={autoSave}
                            onCheckedChange={setAutoSave}
                            closeOnClick={closeCheckboxOnClick}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[highlighted]:bg-teal-50"
                          >
                            <DropdownMenu.CheckboxItemIndicator
                              keepMounted
                              render={(props, state) => (
                                <Checkbox
                                  checked={state.checked}
                                  tabIndex={-1}
                                  onClick={
                                    closeCheckboxOnClick
                                      ? (e) => {
                                          e.stopPropagation()
                                          state.toggle()
                                        }
                                      : undefined
                                  }
                                />
                              )}
                            />
                            <span>Auto-save</span>
                          </DropdownMenu.CheckboxItem>
                        </>
                      ) : (
                        // Default indicator rendering
                        <>
                          <DropdownMenu.CheckboxItem
                            checked={notifications}
                            onCheckedChange={setNotifications}
                            closeOnClick={closeCheckboxOnClick}
                            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-teal-50"
                          >
                            <span>Notifications</span>
                            <DropdownMenu.CheckboxItemIndicator className="flex h-4 w-4 items-center justify-center">
                              <CheckIcon className="h-4 w-4 text-teal-600" />
                            </DropdownMenu.CheckboxItemIndicator>
                          </DropdownMenu.CheckboxItem>
                          <DropdownMenu.CheckboxItem
                            checked={darkMode}
                            onCheckedChange={setDarkMode}
                            closeOnClick={closeCheckboxOnClick}
                            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-teal-50"
                          >
                            <span>Dark Mode</span>
                            <DropdownMenu.CheckboxItemIndicator className="flex h-4 w-4 items-center justify-center">
                              <CheckIcon className="h-4 w-4 text-teal-600" />
                            </DropdownMenu.CheckboxItemIndicator>
                          </DropdownMenu.CheckboxItem>
                          <DropdownMenu.CheckboxItem
                            checked={autoSave}
                            onCheckedChange={setAutoSave}
                            closeOnClick={closeCheckboxOnClick}
                            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-teal-50"
                          >
                            <span>Auto-save</span>
                            <DropdownMenu.CheckboxItemIndicator className="flex h-4 w-4 items-center justify-center">
                              <CheckIcon className="h-4 w-4 text-teal-600" />
                            </DropdownMenu.CheckboxItemIndicator>
                          </DropdownMenu.CheckboxItem>
                        </>
                      )}
                    </DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.Popup>
              </DropdownMenu.Positioner>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </DemoCard>

      <ConfigPanel title="CheckboxItem Props">
        <ConfigRow
          label="closeOnClick"
          description="Close menu when clicking item"
        >
          <Toggle
            checked={closeCheckboxOnClick}
            onChange={setCloseCheckboxOnClick}
          />
        </ConfigRow>
        <ConfigRow
          label="Custom Checkbox"
          description="Use Checkbox UI component"
        >
          <Toggle checked={useCustomCheckbox} onChange={setUseCustomCheckbox} />
        </ConfigRow>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Demo 4: Submenus
// ============================================================================

function SubmenuDemo() {
  // Config
  const [closeRootOnEsc, setCloseRootOnEsc] = React.useState(true)
  const [showSearchInSubmenu, setShowSearchInSubmenu] = React.useState(false)

  return (
    <DemoSection
      title="Submenus"
      description="Nested menus with configurable escape behavior and search"
    >
      <DemoCard>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-500">
            File Menu
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner sideOffset={8}>
              <DropdownMenu.Popup className="min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg">
                <DropdownMenu.Surface>
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
                    <DropdownMenu.Submenu closeRootOnEsc={closeRootOnEsc}>
                      <DropdownMenu.SubmenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100">
                        <span>Share</span>
                        <DropdownMenu.SubmenuTriggerIndicator className="text-muted-foreground/75 shrink-0 size-4">
                          <CaretRightIcon className="size-full" />
                        </DropdownMenu.SubmenuTriggerIndicator>
                      </DropdownMenu.SubmenuTrigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Positioner sideOffset={4}>
                          <DropdownMenu.Popup className="min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg">
                            <DropdownMenu.Surface>
                              {showSearchInSubmenu && (
                                <div className="border-b border-gray-200 p-2">
                                  <DropdownMenu.Input
                                    placeholder="Search..."
                                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                  />
                                </div>
                              )}
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
                                <DropdownMenu.Submenu
                                  closeRootOnEsc={closeRootOnEsc}
                                >
                                  <DropdownMenu.SubmenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100">
                                    <span>Social Media</span>
                                    <DropdownMenu.SubmenuTriggerIndicator className="text-muted-foreground/75 shrink-0 size-4">
                                      <CaretRightIcon className="size-full" />
                                    </DropdownMenu.SubmenuTriggerIndicator>
                                  </DropdownMenu.SubmenuTrigger>
                                  <DropdownMenu.Portal>
                                    <DropdownMenu.Positioner sideOffset={4}>
                                      <DropdownMenu.Popup className="min-w-[140px] rounded-lg border border-gray-200 bg-white shadow-lg">
                                        <DropdownMenu.Surface>
                                          <DropdownMenu.List className="p-1 focus:outline-none">
                                            <DropdownMenu.Item
                                              className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                              onSelect={() => toast('Twitter')}
                                            >
                                              Twitter
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item
                                              className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                              onSelect={() => toast('Facebook')}
                                            >
                                              Facebook
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item
                                              className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                                              onSelect={() => toast('LinkedIn')}
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
                              {showSearchInSubmenu && (
                                <DropdownMenu.Empty className="px-3 py-4 text-center text-sm text-gray-500">
                                  No results
                                </DropdownMenu.Empty>
                              )}
                            </DropdownMenu.Surface>
                          </DropdownMenu.Popup>
                        </DropdownMenu.Positioner>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Submenu>

                    <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

                    <DropdownMenu.Item
                      className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 data-[highlighted]:bg-red-50"
                      onSelect={() => toast('Delete')}
                    >
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </DemoCard>

      <ConfigPanel title="Submenu Props">
        <ConfigRow
          label="closeRootOnEsc"
          description="Escape closes entire menu tree"
        >
          <Toggle checked={closeRootOnEsc} onChange={setCloseRootOnEsc} />
        </ConfigRow>
        <ConfigRow
          label="Search in Submenu"
          description="Show search input in submenus"
        >
          <Toggle
            checked={showSearchInSubmenu}
            onChange={setShowSearchInSubmenu}
          />
        </ConfigRow>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Demo 5: Trigger Behavior
// ============================================================================

function TriggerBehaviorDemo() {
  // Config
  const [modal, setModal] = React.useState<'true' | 'false' | 'trap-focus'>(
    'true',
  )
  const [openOnHover, setOpenOnHover] = React.useState(false)
  const [delay, setDelay] = React.useState(300)
  const [closeDelay, setCloseDelay] = React.useState(150)
  const [closeOnClickItem, setCloseOnClickItem] = React.useState(true)

  const modalValue =
    modal === 'true' ? true : modal === 'false' ? false : 'trap-focus'

  return (
    <DemoSection
      title="Trigger Behavior"
      description="Control how the menu opens and interacts with the page"
    >
      <DemoCard>
        <DropdownMenu.Root modal={modalValue}>
          <DropdownMenu.Trigger
            openOnHover={openOnHover}
            delay={delay}
            closeDelay={closeDelay}
            className={cn(
              'rounded-md px-4 py-2 text-white transition-colors',
              openOnHover
                ? 'bg-cyan-600 hover:bg-cyan-500'
                : 'bg-violet-600 hover:bg-violet-500',
            )}
          >
            {openOnHover ? 'Hover Me' : 'Click Me'}
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner sideOffset={8}>
              <DropdownMenu.Popup className="min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg">
                <DropdownMenu.Surface>
                  <DropdownMenu.List className="p-1 focus:outline-none">
                    <DropdownMenu.Item
                      closeOnClick={closeOnClickItem}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                      onSelect={() => toast('Dashboard')}
                    >
                      Dashboard
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      closeOnClick={closeOnClickItem}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                      onSelect={() => toast('Analytics')}
                    >
                      Analytics
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      closeOnClick={closeOnClickItem}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                      onSelect={() => toast('Reports')}
                    >
                      Reports
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />
                    <DropdownMenu.Item
                      closeOnClick={closeOnClickItem}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100"
                      onSelect={() => toast('Settings')}
                    >
                      Settings
                    </DropdownMenu.Item>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </DemoCard>

      <ConfigPanel title="Root Props">
        <ConfigRow label="modal" description="Modal behavior when open">
          <Select
            value={modal}
            onChange={setModal}
            options={[
              { value: 'true', label: 'true (lock scroll)' },
              { value: 'false', label: 'false' },
              { value: 'trap-focus', label: 'trap-focus' },
            ]}
          />
        </ConfigRow>
      </ConfigPanel>

      <ConfigPanel title="Trigger Props">
        <ConfigRow label="openOnHover" description="Open menu on hover">
          <Toggle checked={openOnHover} onChange={setOpenOnHover} />
        </ConfigRow>
        <ConfigRow label="delay" description="Delay before opening (ms)">
          <NumberInput
            value={delay}
            onChange={setDelay}
            min={0}
            max={1000}
            step={50}
          />
        </ConfigRow>
        <ConfigRow label="closeDelay" description="Delay before closing (ms)">
          <NumberInput
            value={closeDelay}
            onChange={setCloseDelay}
            min={0}
            max={1000}
            step={50}
          />
        </ConfigRow>
      </ConfigPanel>

      <ConfigPanel title="Item Props">
        <ConfigRow
          label="closeOnClick"
          description="Close menu when item clicked"
        >
          <Toggle checked={closeOnClickItem} onChange={setCloseOnClickItem} />
        </ConfigRow>
      </ConfigPanel>
    </DemoSection>
  )
}

// ============================================================================
// Icons
// ============================================================================

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

const CloseIcon = ({ ...props }: React.HTMLAttributes<SVGSVGElement>) => {
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
        d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}

const ChevronDownIcon = ({ ...props }: React.HTMLAttributes<SVGSVGElement>) => {
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
        d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}

const ChevronUpIcon = ({ ...props }: React.HTMLAttributes<SVGSVGElement>) => {
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
        d="M3.13523 8.84197C3.3241 9.04343 3.64052 9.05363 3.84197 8.86477L7.5 5.43536L11.158 8.86477C11.3595 9.05363 11.6759 9.04343 11.8648 8.84197C12.0536 8.64051 12.0434 8.32409 11.842 8.13523L7.84197 4.38523C7.64964 4.20492 7.35036 4.20492 7.15803 4.38523L3.15803 8.13523C2.95657 8.32409 2.94637 8.64051 3.13523 8.84197Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}

const CollapsibleChevron = ({
  ...props
}: React.HTMLAttributes<SVGSVGElement>) => {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentcolor" strokeWidth="1.5" />
    </svg>
  )
}
