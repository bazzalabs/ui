'use client'

import { DropdownMenu } from '@bazza-ui/react'
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

export function Playground() {
  return (
    <div className="space-y-12 p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          DropdownMenu Playground
        </h1>
        <p className="text-gray-500">
          Interactive demos to explore the DropdownMenu component features
        </p>
      </div>

      <KeyboardShortcutsDemo />
      <SurfaceSearchDemo />
      <PositioningDemo />
      <SelectionsDemo />
      <SubmenuDemo />
      <TriggerBehaviorDemo />
    </div>
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
