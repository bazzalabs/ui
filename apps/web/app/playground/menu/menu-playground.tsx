'use client'

import { Collapsible } from '@base-ui/react/collapsible'
import { ScrollArea } from '@base-ui/react/scroll-area'
import { useComboboxItemContext } from '@bazza-ui/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AnimatePresence, motion } from 'motion/react'
import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Animated Chevrons Icon (morphs between up-down and down-up states)
// ============================================================================

interface AnimatedChevronsIconProps {
  open: boolean
  className?: string
}

function AnimatedChevronsIcon({ open, className }: AnimatedChevronsIconProps) {
  const swapDistance = 11

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.path
        d="m7 9 5-5 5 5"
        initial={false}
        animate={{ y: open ? swapDistance : 0 }}
        transition={{ duration: 0.15, ease: 'easeInOut' }}
      />
      <motion.path
        d="m7 15 5 5 5-5"
        initial={false}
        animate={{ y: open ? -swapDistance : 0 }}
        transition={{ duration: 0.15, ease: 'easeInOut' }}
      />
    </svg>
  )
}

// ============================================================================
// Highlight Indicator for Combobox Items
// ============================================================================

function HighlightIndicator({ layoutId }: { layoutId: string }) {
  const { highlighted } = useComboboxItemContext()

  if (!highlighted) return null

  return (
    <motion.div
      layoutId={layoutId}
      className="absolute inset-0 rounded-lg bg-neutral-200"
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 35,
      }}
    />
  )
}

// ============================================================================
// Custom Input with Styleable Caret
// ============================================================================

interface CustomCaretInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'children'> {
  caret?: React.ReactNode | ((state: { active: boolean }) => React.ReactNode)
  containerClassName?: string
  activeTimeout?: number
}

const CustomCaretInput = React.forwardRef<
  HTMLInputElement,
  CustomCaretInputProps
>(function CustomCaretInput(props, forwardedRef) {
  const {
    caret,
    containerClassName,
    className,
    style,
    activeTimeout = 500,
    ...inputProps
  } = props
  const [isFocused, setIsFocused] = React.useState(false)
  const [isActive, setIsActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const measureRef = React.useRef<HTMLSpanElement>(null)
  const [caretLeft, setCaretLeft] = React.useState(0)
  const activeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  const mergedRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    [forwardedRef],
  )

  const markActive = React.useCallback(() => {
    setIsActive(true)
    if (activeTimeoutRef.current) {
      clearTimeout(activeTimeoutRef.current)
    }
    activeTimeoutRef.current = setTimeout(() => {
      setIsActive(false)
    }, activeTimeout)
  }, [activeTimeout])

  React.useEffect(() => {
    return () => {
      if (activeTimeoutRef.current) {
        clearTimeout(activeTimeoutRef.current)
      }
    }
  }, [])

  const updateCaretPosition = React.useCallback(() => {
    const input = inputRef.current
    const measure = measureRef.current
    if (!input || !measure) return

    const pos = input.selectionStart ?? 0
    const textBeforeCaret = input.value.substring(0, pos)
    measure.textContent = textBeforeCaret || '\u200b'

    const computedStyle = window.getComputedStyle(input)
    measure.style.font = computedStyle.font
    measure.style.letterSpacing = computedStyle.letterSpacing

    const newLeft = measure.offsetWidth
    if (newLeft !== caretLeft) {
      setCaretLeft(newLeft)
      markActive()
    }
  }, [caretLeft, markActive])

  React.useEffect(() => {
    const input = inputRef.current
    if (!input) return

    const handleSelectionChange = () => {
      if (document.activeElement === input) {
        updateCaretPosition()
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () =>
      document.removeEventListener('selectionchange', handleSelectionChange)
  }, [updateCaretPosition])

  const valueFromProps = inputProps.value
  React.useEffect(() => {
    requestAnimationFrame(() => {
      updateCaretPosition()
    })
  }, [valueFromProps, updateCaretPosition])

  const handleFocus = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      updateCaretPosition()
      props.onFocus?.(e)
    },
    [props.onFocus, updateCaretPosition],
  )

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setIsActive(false)
      props.onBlur?.(e)
    },
    [props.onBlur],
  )

  const handleInput = React.useCallback(() => {
    updateCaretPosition()
    markActive()
  }, [updateCaretPosition, markActive])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'Home' ||
        e.key === 'End'
      ) {
        markActive()
      }
      props.onKeyDown?.(e)
    },
    [markActive, props.onKeyDown],
  )

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      updateCaretPosition()
      markActive()
      inputProps.onClick?.(e)
    },
    [updateCaretPosition, markActive, inputProps.onClick],
  )

  const defaultCaret = (active: boolean) => (
    <motion.div
      className="w-[2px] h-[1.2em] bg-current rounded-full"
      animate={{ opacity: active ? 1 : [1, 0] }}
      transition={
        active
          ? { duration: 0.1 }
          : {
              duration: 0.5,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: 'reverse',
            }
      }
    />
  )

  const renderedCaret =
    typeof caret === 'function'
      ? caret({ active: isActive })
      : (caret ?? defaultCaret(isActive))

  return (
    <div className={cn('relative', containerClassName)}>
      <span
        ref={measureRef}
        className="absolute invisible whitespace-pre pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={mergedRef}
        {...inputProps}
        className={cn('caret-transparent', className)}
        style={style}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      />
      {isFocused && (
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
          initial={false}
          animate={{ x: caretLeft }}
          transition={{
            type: 'spring',
            stiffness: 800,
            damping: 40,
          }}
        >
          {renderedCaret}
        </motion.div>
      )}
    </div>
  )
})

// ============================================================================
// Types
// ============================================================================

interface DemoConfig {
  id: string
  title: string
  description: string
  component: string
}

interface ComponentSection {
  id: string
  title: string
  demos: DemoConfig[]
}

// ============================================================================
// Demo Registry
// ============================================================================

const COMPONENTS: ComponentSection[] = [
  {
    id: 'dropdown-menu',
    title: 'DropdownMenu',
    demos: [
      {
        id: 'basic',
        title: 'Basic',
        description: 'Simple dropdown menu',
        component: 'DropdownMenu',
      },
      {
        id: 'with-search',
        title: 'With Search',
        description: 'Searchable dropdown with filtering',
        component: 'DropdownMenu',
      },
      {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts',
        description: 'Items with keyboard shortcuts',
        component: 'DropdownMenu',
      },
      {
        id: 'selections',
        title: 'Selections',
        description: 'Radio and checkbox selections',
        component: 'DropdownMenu',
      },
      {
        id: 'submenus',
        title: 'Submenus',
        description: 'Nested submenu navigation',
        component: 'DropdownMenu',
      },
      {
        id: 'virtualized',
        title: 'Virtualized',
        description: 'Virtualized list with 10k+ items',
        component: 'DropdownMenu',
      },
    ],
  },
  {
    id: 'context-menu',
    title: 'ContextMenu',
    demos: [
      {
        id: 'basic',
        title: 'Basic',
        description: 'Right-click context menu',
        component: 'ContextMenu',
      },
      {
        id: 'with-submenus',
        title: 'With Submenus',
        description: 'Nested context menu',
        component: 'ContextMenu',
      },
    ],
  },
  {
    id: 'select',
    title: 'Select',
    demos: [
      {
        id: 'basic',
        title: 'Basic',
        description: 'Single select dropdown',
        component: 'Select',
      },
      {
        id: 'multi',
        title: 'Multi Select',
        description: 'Multiple selection',
        component: 'Select',
      },
      {
        id: 'searchable',
        title: 'Searchable',
        description: 'With search filtering',
        component: 'Select',
      },
      {
        id: 'grouped',
        title: 'Grouped',
        description: 'Grouped options',
        component: 'Select',
      },
    ],
  },
  {
    id: 'combobox',
    title: 'Combobox',
    demos: [
      {
        id: 'basic',
        title: 'Basic',
        description: 'Input-based select',
        component: 'Combobox',
      },
      {
        id: 'input-embedded',
        title: 'Input Embedded',
        description: 'macOS-style popup',
        component: 'Combobox',
      },
      {
        id: 'multi',
        title: 'Multi Select',
        description: 'Multiple selection',
        component: 'Combobox',
      },
      {
        id: 'virtualized',
        title: 'Virtualized',
        description: 'Large list virtualization',
        component: 'Combobox',
      },
    ],
  },
]

// ============================================================================
// Context for active demo
// ============================================================================

interface PlaygroundContextValue {
  activeDemo: string | null
  setActiveDemo: (id: string | null) => void
  configContent: React.ReactNode
  setConfigContent: (content: React.ReactNode) => void
}

const PlaygroundContext = React.createContext<PlaygroundContextValue | null>(
  null,
)

function usePlayground() {
  const context = React.useContext(PlaygroundContext)
  if (!context) {
    throw new Error('usePlayground must be used within PlaygroundProvider')
  }
  return context
}

// ============================================================================
// TOC Sidebar
// ============================================================================

function TOCSidebar() {
  const { activeDemo, setActiveDemo, setConfigContent } = usePlayground()

  const scrollToDemo = (demoId: string) => {
    const element = document.getElementById(demoId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Get the active component section from the activeDemo
  const activeSection = activeDemo?.split('-').slice(0, -1).join('-')

  return (
    <aside className="fixed top-20 left-4 w-52 max-h-[calc(100vh-6rem)] rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-lg overflow-hidden z-40">
      <div className="bg-background border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Components</h2>
      </div>
      <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)]">
        {COMPONENTS.map((section) => {
          const isActiveSection =
            activeSection === section.id || activeDemo?.startsWith(section.id)

          return (
            <div key={section.id}>
              <button
                type="button"
                onClick={() =>
                  scrollToDemo(`${section.id}-${section.demos[0]?.id}`)
                }
                className={cn(
                  'text-sm font-medium transition-colors flex items-center gap-2 text-left',
                  isActiveSection
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary',
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-colors',
                    isActiveSection ? 'bg-primary' : 'bg-primary/30',
                  )}
                />
                {section.title}
              </button>
              <ul className="mt-1.5 space-y-0.5 ml-4 border-l border-border/50">
                {section.demos.map((demo) => {
                  const demoId = `${section.id}-${demo.id}`
                  const isActive = activeDemo === demoId
                  return (
                    <li key={demo.id}>
                      <button
                        type="button"
                        onClick={() => scrollToDemo(demoId)}
                        className={cn(
                          'block w-full text-left text-xs py-1 pl-3 transition-all border-l-2 -ml-px rounded-r',
                          isActive
                            ? 'text-primary font-medium border-primary bg-primary/5'
                            : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border',
                        )}
                      >
                        {demo.title}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

// ============================================================================
// Floating Config Panel
// ============================================================================

interface ConfigSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function ConfigSection({
  title,
  defaultOpen = true,
  children,
}: ConfigSectionProps) {
  return (
    <Collapsible.Root
      defaultOpen={defaultOpen}
      className="border-b border-border last:border-b-0"
    >
      <Collapsible.Trigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors group">
        <span>{title}</span>
        <ChevronIcon className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-180" />
      </Collapsible.Trigger>
      <Collapsible.Panel className="overflow-hidden data-[starting-style]:h-0 data-[ending-style]:h-0 transition-[height] duration-200">
        <div className="px-4 pb-4 space-y-3">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

function FloatingConfigPanel() {
  const { configContent, activeDemo } = usePlayground()

  // Prevent pointer events from propagating to avoid closing open menus
  const preventOutsideClick = React.useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
  }, [])

  return (
    <aside
      className="fixed top-20 right-4 w-72 max-h-[calc(100vh-6rem)] rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-lg overflow-hidden z-40"
      onPointerDownCapture={preventOutsideClick}
    >
      <div className="bg-background border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Configuration</h3>
        {activeDemo && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {activeDemo
              .replace(/-/g, ' > ')
              .replace(/(\b\w)/g, (c) => c.toUpperCase())}
          </p>
        )}
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-10rem)]">
        {!activeDemo ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Scroll to a demo to see configuration options
          </div>
        ) : configContent ? (
          configContent
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            No configuration options
          </div>
        )}
      </div>
    </aside>
  )
}

// ============================================================================
// Config Controls
// ============================================================================

interface ConfigRowProps {
  label: string
  description?: string
  children: React.ReactNode
}

export function ConfigRow({ label, description, children }: ConfigRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground truncate">
            {description}
          </div>
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

export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform',
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

export function Select<T extends string>({
  value,
  onChange,
  options,
}: SelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="rounded-md border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
  disabled?: boolean
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
}: NumberInputProps) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn(
        'w-20 rounded-md border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    />
  )
}

// ============================================================================
// Demo Section Component (Full Screen)
// ============================================================================

interface DemoSectionProps {
  id: string
  title: string
  description: string
  component: string
  children: React.ReactNode
  config?: React.ReactNode
}

function DemoSection({
  id,
  title,
  description,
  component,
  children,
  config,
}: DemoSectionProps) {
  const { setActiveDemo, setConfigContent, activeDemo } = usePlayground()
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveDemo(id)
            setConfigContent(config || null)
          }
        })
      },
      { threshold: 0.5 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [id, config, setActiveDemo, setConfigContent])

  const isActive = activeDemo === id

  return (
    <section
      ref={ref}
      id={id}
      className="h-screen w-full snap-start snap-always flex flex-col"
    >
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-4">
        <div className="text-xs font-medium text-primary/70 uppercase tracking-wider mb-1">
          {component}
        </div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {/* Demo Area */}
      <div className="flex-1 px-8 pb-8 min-h-0">
        <div
          className={cn(
            'h-full w-full rounded-2xl border-2 flex items-center justify-center transition-all duration-300',
            isActive
              ? 'border-primary/20 bg-gradient-to-br from-primary/5 to-transparent'
              : 'border-border/50 bg-muted/10',
          )}
        >
          {children}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// Main Playground Area
// ============================================================================

function MainPlayground() {
  return (
    <main className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth">
      {/* DropdownMenu Demos */}
      <BasicDropdownDemo />
      <SearchableDropdownDemo />
      <KeyboardShortcutsDemo />
      <SelectionsDropdownDemo />
      <SubmenusDemo />

      {/* ContextMenu Demos */}
      <BasicContextMenuDemo />

      {/* Select Demos */}
      <BasicSelectDemo />
      <MultiSelectDemo />

      {/* Combobox Demos */}
      <BasicComboboxDemo />
      <InputEmbeddedComboboxDemo />
      <MultiComboboxDemo />
      <VirtualizedComboboxDemo />
    </main>
  )
}

// ============================================================================
// Demo Components (stubs - we'll add real implementations)
// ============================================================================

import {
  Combobox,
  ContextMenu,
  DropdownMenu,
  Select as SelectPrimitive,
} from '@bazza-ui/react'
import { toast } from 'sonner'

// --- Basic Dropdown Demo ---

function BasicDropdownDemo() {
  const [closeOnClick, setCloseOnClick] = React.useState(true)

  const config = (
    <>
      <ConfigSection title="Behavior">
        <ConfigRow label="closeOnClick" description="Close when item clicked">
          <Toggle checked={closeOnClick} onChange={setCloseOnClick} />
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="dropdown-menu-basic"
      title="Basic"
      description="Simple dropdown menu with items"
      component="DropdownMenu"
      config={config}
    >
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
          Open Menu
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[180px] rounded-lg border border-border bg-popover shadow-lg">
              <DropdownMenu.Surface>
                <DropdownMenu.List className="p-1 focus:outline-none">
                  <DropdownMenu.Item
                    closeOnClick={closeOnClick}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    onSelect={() => toast('Profile')}
                  >
                    Profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    closeOnClick={closeOnClick}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    onSelect={() => toast('Settings')}
                  >
                    Settings
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item
                    closeOnClick={closeOnClick}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-destructive data-[highlighted]:bg-destructive/10"
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
    </DemoSection>
  )
}

// --- Searchable Dropdown Demo ---

function SearchableDropdownDemo() {
  const [loop, setLoop] = React.useState(true)
  const [autoHighlightFirst, setAutoHighlightFirst] = React.useState(true)
  const [filterEnabled, setFilterEnabled] = React.useState(true)

  const fruits = [
    { value: 'apple', label: 'Apple', keywords: ['fruit', 'red'] },
    { value: 'banana', label: 'Banana', keywords: ['fruit', 'yellow'] },
    { value: 'cherry', label: 'Cherry', keywords: ['fruit', 'red'] },
    { value: 'dragonfruit', label: 'Dragon Fruit', keywords: ['exotic'] },
    { value: 'elderberry', label: 'Elderberry', keywords: ['berry'] },
    { value: 'fig', label: 'Fig', keywords: ['mediterranean'] },
    { value: 'grape', label: 'Grape', keywords: ['wine'] },
    { value: 'honeydew', label: 'Honeydew', keywords: ['melon'] },
  ]

  const config = (
    <>
      <ConfigSection title="Surface Props">
        <ConfigRow label="loop" description="Loop navigation">
          <Toggle checked={loop} onChange={setLoop} />
        </ConfigRow>
        <ConfigRow
          label="autoHighlightFirst"
          description="Highlight first on open"
        >
          <Toggle
            checked={autoHighlightFirst}
            onChange={setAutoHighlightFirst}
          />
        </ConfigRow>
        <ConfigRow label="filter" description="Enable fuzzy filtering">
          <Toggle checked={filterEnabled} onChange={setFilterEnabled} />
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="dropdown-menu-with-search"
      component="DropdownMenu"
      title="With Search"
      description="Dropdown with search input and fuzzy filtering"
      config={config}
    >
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
          Select Fruit
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[220px] rounded-lg border border-border bg-popover shadow-lg">
              <DropdownMenu.Surface
                loop={loop}
                autoHighlightFirst={autoHighlightFirst}
                filter={filterEnabled ? undefined : false}
              >
                <div className="border-b border-border p-2">
                  <DropdownMenu.Input
                    placeholder="Search fruits..."
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <DropdownMenu.List className="max-h-[200px] overflow-y-auto p-1 focus:outline-none">
                  {fruits.map((fruit) => (
                    <DropdownMenu.Item
                      key={fruit.value}
                      value={fruit.value}
                      keywords={fruit.keywords}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                      onSelect={() => toast(`Selected: ${fruit.label}`)}
                    >
                      {fruit.label}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.List>
                <DropdownMenu.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No fruits found
                </DropdownMenu.Empty>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </DemoSection>
  )
}

// --- Keyboard Shortcuts Demo ---

function KeyboardShortcutsDemo() {
  const [status, setStatus] = React.useState('backlog')

  const statuses = [
    { value: 'icebox', label: 'Icebox', shortcut: '1' },
    { value: 'backlog', label: 'Backlog', shortcut: '2' },
    { value: 'todo', label: 'Todo', shortcut: '3' },
    { value: 'inprogress', label: 'In Progress', shortcut: '4' },
    { value: 'done', label: 'Done', shortcut: '5' },
  ]

  const config = (
    <>
      <ConfigSection title="Current State">
        <ConfigRow label="status" description="Currently selected">
          <span className="text-sm font-medium">{status}</span>
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="How It Works" defaultOpen={false}>
        <p className="text-xs text-muted-foreground">
          Press number keys 1-5 while the menu is open to quickly select a
          status.
        </p>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="dropdown-menu-keyboard-shortcuts"
      component="DropdownMenu"
      title="Keyboard Shortcuts"
      description="Press number keys (1-5) to quickly select when menu is open"
      config={config}
    >
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
          Status: {statuses.find((s) => s.value === status)?.label}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[200px] rounded-lg border border-border bg-popover shadow-lg">
              <DropdownMenu.Surface>
                <DropdownMenu.List className="p-1 focus:outline-none">
                  {statuses.map((s) => (
                    <DropdownMenu.Item
                      key={s.value}
                      shortcut={s.shortcut}
                      className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                      onSelect={() => {
                        setStatus(s.value)
                        toast(`Status: ${s.label}`)
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span>{s.label}</span>
                        {status === s.value && (
                          <CheckIcon className="h-4 w-4 text-primary" />
                        )}
                      </span>
                      <DropdownMenu.Shortcut className="text-xs text-muted-foreground" />
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </DemoSection>
  )
}

// --- Selections Demo ---

function SelectionsDropdownDemo() {
  const [sortBy, setSortBy] = React.useState<'name' | 'date' | 'size'>('name')
  const [notifications, setNotifications] = React.useState(true)
  const [darkMode, setDarkMode] = React.useState(false)
  const [closeCheckboxOnClick, setCloseCheckboxOnClick] = React.useState(false)

  const config = (
    <>
      <ConfigSection title="Radio Selection">
        <ConfigRow label="sortBy" description="Current sort order">
          <Select
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'name', label: 'Name' },
              { value: 'date', label: 'Date' },
              { value: 'size', label: 'Size' },
            ]}
          />
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="Checkbox State">
        <ConfigRow label="notifications">
          <Toggle checked={notifications} onChange={setNotifications} />
        </ConfigRow>
        <ConfigRow label="darkMode">
          <Toggle checked={darkMode} onChange={setDarkMode} />
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="Behavior">
        <ConfigRow
          label="closeOnClick"
          description="Close menu on checkbox click"
        >
          <Toggle
            checked={closeCheckboxOnClick}
            onChange={setCloseCheckboxOnClick}
          />
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="dropdown-menu-selections"
      component="DropdownMenu"
      title="Selections"
      description="Radio groups for single selection, checkboxes for multiple"
      config={config}
    >
      <div className="flex gap-4">
        {/* Radio Demo */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
            Sort by: {sortBy}
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner sideOffset={8}>
              <DropdownMenu.Popup className="min-w-[160px] rounded-lg border border-border bg-popover shadow-lg">
                <DropdownMenu.Surface>
                  <DropdownMenu.List className="p-1 focus:outline-none">
                    <DropdownMenu.RadioGroup
                      value={sortBy}
                      onValueChange={setSortBy}
                    >
                      {(['name', 'date', 'size'] as const).map((val) => (
                        <DropdownMenu.RadioItem
                          key={val}
                          value={val}
                          className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm capitalize data-[highlighted]:bg-accent"
                        >
                          <span>{val}</span>
                          <DropdownMenu.RadioItemIndicator className="h-4 w-4">
                            <CheckIcon className="h-4 w-4 text-primary" />
                          </DropdownMenu.RadioItemIndicator>
                        </DropdownMenu.RadioItem>
                      ))}
                    </DropdownMenu.RadioGroup>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Checkbox Demo */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80 transition-colors">
            Settings
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner sideOffset={8}>
              <DropdownMenu.Popup className="min-w-[180px] rounded-lg border border-border bg-popover shadow-lg">
                <DropdownMenu.Surface>
                  <DropdownMenu.List className="p-1 focus:outline-none">
                    <DropdownMenu.CheckboxItem
                      checked={notifications}
                      onCheckedChange={setNotifications}
                      closeOnClick={closeCheckboxOnClick}
                      className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    >
                      <span>Notifications</span>
                      <DropdownMenu.CheckboxItemIndicator className="h-4 w-4">
                        <CheckIcon className="h-4 w-4 text-primary" />
                      </DropdownMenu.CheckboxItemIndicator>
                    </DropdownMenu.CheckboxItem>
                    <DropdownMenu.CheckboxItem
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                      closeOnClick={closeCheckboxOnClick}
                      className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    >
                      <span>Dark Mode</span>
                      <DropdownMenu.CheckboxItemIndicator className="h-4 w-4">
                        <CheckIcon className="h-4 w-4 text-primary" />
                      </DropdownMenu.CheckboxItemIndicator>
                    </DropdownMenu.CheckboxItem>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </DemoSection>
  )
}

// --- Submenus Demo ---

function SubmenusDemo() {
  const [closeRootOnEsc, setCloseRootOnEsc] = React.useState(true)

  const config = (
    <>
      <ConfigSection title="Submenu Props">
        <ConfigRow
          label="closeRootOnEsc"
          description="Escape closes entire tree"
        >
          <Toggle checked={closeRootOnEsc} onChange={setCloseRootOnEsc} />
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="dropdown-menu-submenus"
      component="DropdownMenu"
      title="Submenus"
      description="Nested submenu navigation"
      config={config}
    >
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
          File Menu
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={8}>
            <DropdownMenu.Popup className="min-w-[180px] rounded-lg border border-border bg-popover shadow-lg">
              <DropdownMenu.Surface>
                <DropdownMenu.List className="p-1 focus:outline-none">
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    onSelect={() => toast('New File')}
                  >
                    New File
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    onSelect={() => toast('Open')}
                  >
                    Open
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Submenu closeRootOnEsc={closeRootOnEsc}>
                    <DropdownMenu.SubmenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent">
                      <span>Share</span>
                      <CaretRightIcon className="h-4 w-4 text-muted-foreground" />
                    </DropdownMenu.SubmenuTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Positioner sideOffset={4}>
                        <DropdownMenu.Popup className="min-w-[140px] rounded-lg border border-border bg-popover shadow-lg">
                          <DropdownMenu.Surface>
                            <DropdownMenu.List className="p-1 focus:outline-none">
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                                onSelect={() => toast('Email')}
                              >
                                Email
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                                onSelect={() => toast('Slack')}
                              >
                                Slack
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                                onSelect={() => toast('Copy Link')}
                              >
                                Copy Link
                              </DropdownMenu.Item>
                            </DropdownMenu.List>
                          </DropdownMenu.Surface>
                        </DropdownMenu.Popup>
                      </DropdownMenu.Positioner>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Submenu>
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-destructive data-[highlighted]:bg-destructive/10"
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
    </DemoSection>
  )
}

// --- Basic Context Menu Demo ---

function BasicContextMenuDemo() {
  const config = (
    <>
      <ConfigSection title="Usage">
        <p className="text-xs text-muted-foreground">
          Right-click on the demo area to open the context menu.
        </p>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="context-menu-basic"
      component="ContextMenu"
      title="Basic"
      description="Right-click to open context menu"
      config={config}
    >
      <ContextMenu.Root>
        <ContextMenu.Trigger className="flex h-[200px] w-[300px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50">
          <div className="text-center">
            <div className="text-sm font-medium">Right-click here</div>
            <div className="text-xs text-muted-foreground">
              or long-press on touch
            </div>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup className="min-w-[180px] rounded-lg border border-border bg-popover shadow-lg">
              <ContextMenu.Surface>
                <ContextMenu.List className="p-1 focus:outline-none">
                  <ContextMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    onSelect={() => toast('Cut')}
                  >
                    Cut
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    onSelect={() => toast('Copy')}
                  >
                    Copy
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    onSelect={() => toast('Paste')}
                  >
                    Paste
                  </ContextMenu.Item>
                  <ContextMenu.Separator className="my-1 h-px bg-border" />
                  <ContextMenu.Item
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-destructive data-[highlighted]:bg-destructive/10"
                    onSelect={() => toast('Delete')}
                  >
                    Delete
                  </ContextMenu.Item>
                </ContextMenu.List>
              </ContextMenu.Surface>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    </DemoSection>
  )
}

// --- Basic Select Demo ---

function BasicSelectDemo() {
  const [value, setValue] = React.useState('')

  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
  ]

  const config = (
    <>
      <ConfigSection title="Current State">
        <ConfigRow label="value" description="Selected value">
          <span className="text-sm font-mono">{value || '(none)'}</span>
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="select-basic"
      component="Select"
      title="Basic"
      description="Single select dropdown"
      config={config}
    >
      <SelectPrimitive.Root value={value} onValueChange={setValue}>
        <SelectPrimitive.Trigger className="inline-flex min-w-[200px] items-center justify-between rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-accent/50 data-[placeholder]:text-muted-foreground">
          <SelectPrimitive.Value placeholder="Select a country..." />
          <SelectPrimitive.Icon className="text-muted-foreground data-[popup-open]:rotate-180 transition-transform">
            <ChevronIcon className="h-4 w-4" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner sideOffset={8}>
            <SelectPrimitive.Popup className="min-w-[200px] rounded-lg border border-border bg-popover shadow-lg">
              <SelectPrimitive.Surface>
                <SelectPrimitive.List className="p-1 focus:outline-none">
                  {countries.map((country) => (
                    <SelectPrimitive.Item
                      key={country.value}
                      value={country.value}
                      textValue={country.label}
                      className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent data-[selected]:font-medium"
                    >
                      <SelectPrimitive.ItemLabel />
                      <SelectPrimitive.ItemIndicator className="text-primary">
                        <CheckIcon className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.List>
              </SelectPrimitive.Surface>
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </DemoSection>
  )
}

// --- Multi Select Demo ---

function MultiSelectDemo() {
  const [values, setValues] = React.useState<string[]>(['react'])

  const frameworks = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'Solid' },
  ]

  const config = (
    <>
      <ConfigSection title="Selected Values">
        <div className="flex flex-wrap gap-1">
          {values.length === 0 ? (
            <span className="text-xs text-muted-foreground">None selected</span>
          ) : (
            values.map((v) => (
              <span
                key={v}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {frameworks.find((f) => f.value === v)?.label ?? v}
              </span>
            ))
          )}
        </div>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="select-multi"
      component="Select"
      title="Multi Select"
      description="Select multiple values"
      config={config}
    >
      <SelectPrimitive.Root multiple values={values} onValuesChange={setValues}>
        <SelectPrimitive.Trigger className="inline-flex min-w-[220px] items-center justify-between rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-accent/50 data-[placeholder]:text-muted-foreground">
          <SelectPrimitive.Value placeholder="Select frameworks...">
            {({ values: selectedValues }) => {
              if (selectedValues.length === 0) return 'Select frameworks...'
              if (selectedValues.length <= 2) {
                return selectedValues
                  .map((v) => frameworks.find((f) => f.value === v)?.label ?? v)
                  .join(', ')
              }
              return `${selectedValues.length} selected`
            }}
          </SelectPrimitive.Value>
          <SelectPrimitive.Icon className="text-muted-foreground data-[popup-open]:rotate-180 transition-transform">
            <ChevronIcon className="h-4 w-4" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner sideOffset={8}>
            <SelectPrimitive.Popup className="min-w-[220px] rounded-lg border border-border bg-popover shadow-lg">
              <SelectPrimitive.Surface>
                <SelectPrimitive.List className="p-1 focus:outline-none">
                  {frameworks.map((fw) => (
                    <SelectPrimitive.Item
                      key={fw.value}
                      value={fw.value}
                      textValue={fw.label}
                      className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded border border-border group-data-[selected]:border-primary group-data-[selected]:bg-primary">
                        <SelectPrimitive.ItemIndicator className="text-primary-foreground">
                          <CheckIcon className="h-3 w-3" />
                        </SelectPrimitive.ItemIndicator>
                      </span>
                      <SelectPrimitive.ItemLabel>
                        {fw.label}
                      </SelectPrimitive.ItemLabel>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.List>
              </SelectPrimitive.Surface>
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </DemoSection>
  )
}

// --- Basic Combobox Demo ---

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
  ]

  const countryItems = React.useMemo(
    () => Object.fromEntries(countries.map((c) => [c.value, c.label])),
    [],
  )

  const config = (
    <>
      <ConfigSection title="Root Props">
        <ConfigRow label="openOnFocus" description="Open popup when focused">
          <Toggle checked={openOnFocus} onChange={setOpenOnFocus} />
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="Current State">
        <ConfigRow label="value" description="Selected value">
          <span className="text-sm font-mono">{value || '(none)'}</span>
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="combobox-basic"
      component="Combobox"
      title="Basic"
      description="Input-based select with filtering"
      config={config}
    >
      <Combobox.Root
        value={value}
        onValueChange={setValue}
        items={countryItems}
        openOnFocus={openOnFocus}
      >
        <div className="relative">
          <Combobox.Input
            placeholder="Search countries..."
            className="w-[250px] rounded-md border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <Combobox.Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground data-[popup-open]:rotate-180 transition-transform pointer-events-none">
            <ChevronIcon className="h-4 w-4" />
          </Combobox.Icon>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4}>
            <Combobox.Popup className="w-[250px] rounded-lg border border-border bg-popover shadow-lg">
              <Combobox.Surface>
                <Combobox.List className="max-h-[250px] overflow-y-auto p-1 focus:outline-none">
                  {countries.map((country) => (
                    <Combobox.Item
                      key={country.value}
                      value={country.value}
                      textValue={country.label}
                      className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent data-[selected]:font-medium"
                    >
                      <Combobox.ItemLabel>{country.label}</Combobox.ItemLabel>
                      <Combobox.ItemIndicator className="text-primary">
                        <CheckIcon className="h-4 w-4" />
                      </Combobox.ItemIndicator>
                    </Combobox.Item>
                  ))}
                </Combobox.List>
                <Combobox.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No countries found
                </Combobox.Empty>
              </Combobox.Surface>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </DemoSection>
  )
}

// --- Input Embedded Combobox Demo with Motion ---

function InputEmbeddedComboboxDemo() {
  const [value, setValue] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [shouldAnimateItems, setShouldAnimateItems] = React.useState(false)

  // Positioner config
  const [side, setSide] = React.useState<'top' | 'bottom'>('bottom')
  const [align, setAlign] = React.useState<'start' | 'center' | 'end'>('center')
  const [popupPadding, setPopupPadding] = React.useState(8)
  const [showScrollGradients, setShowScrollGradients] = React.useState(true)

  const fruits = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' },
    { value: 'pineapple', label: 'Pineapple' },
    { value: 'grape', label: 'Grape' },
    { value: 'mango', label: 'Mango' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'watermelon', label: 'Watermelon' },
    { value: 'kiwi', label: 'Kiwi' },
    { value: 'peach', label: 'Peach' },
    { value: 'plum', label: 'Plum' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'blueberry', label: 'Blueberry' },
    { value: 'raspberry', label: 'Raspberry' },
    { value: 'blackberry', label: 'Blackberry' },
    { value: 'coconut', label: 'Coconut' },
    { value: 'papaya', label: 'Papaya' },
    { value: 'lemon', label: 'Lemon' },
  ]

  const fruitItems = React.useMemo(
    () => Object.fromEntries(fruits.map((f) => [f.value, f.label])),
    [],
  )

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      setShouldAnimateItems(true)
    }
    setOpen(nextOpen)
  }, [])

  const config = (
    <>
      <ConfigSection title="Positioner">
        <ConfigRow label="side" description="Preferred side">
          <Select
            value={side}
            onChange={setSide}
            options={[
              { value: 'bottom', label: 'Bottom' },
              { value: 'top', label: 'Top' },
            ]}
          />
        </ConfigRow>
        <ConfigRow label="align" description="Alignment">
          <Select
            value={align}
            onChange={setAlign}
            options={[
              { value: 'center', label: 'Center' },
              { value: 'start', label: 'Start' },
              { value: 'end', label: 'End' },
            ]}
          />
        </ConfigRow>
        <ConfigRow label="popupPadding" description="Padding (px)">
          <NumberInput
            value={popupPadding}
            onChange={setPopupPadding}
            min={0}
            max={24}
            step={2}
          />
        </ConfigRow>
        <ConfigRow label="scrollGradients" description="Fade on edges">
          <Toggle
            checked={showScrollGradients}
            onChange={setShowScrollGradients}
          />
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="Current State">
        <ConfigRow label="value" description="Selected">
          <span className="text-sm font-mono">{value || '(none)'}</span>
        </ConfigRow>
        <ConfigRow label="open" description="Popup state">
          <span className="text-sm font-mono">{open ? 'Yes' : 'No'}</span>
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="combobox-input-embedded"
      component="Combobox"
      title="Input Embedded"
      description="macOS-style popup with motion animations"
      config={config}
    >
      <div className="rounded-2xl bg-neutral-300 p-12">
        <Combobox.Root
          value={value}
          onValueChange={setValue}
          items={fruitItems}
          layout="input-embedded"
          open={open}
          onOpenChange={handleOpenChange}
        >
          <Combobox.InputWrapper className="flex h-10 w-[280px] items-center gap-2 rounded-xl bg-white px-4 shadow-xs border">
            <Combobox.Input
              placeholder="Select a fruit..."
              render={
                <CustomCaretInput
                  containerClassName="flex-1"
                  caret={({ active }) => (
                    <motion.div
                      className="w-[2.5px] h-5 bg-blue-500 rounded-full"
                      animate={{ opacity: active ? 1 : [1, 0.2] }}
                      transition={
                        active
                          ? { duration: 0.05 }
                          : {
                              duration: 0.4,
                              repeat: Number.POSITIVE_INFINITY,
                              repeatType: 'reverse',
                              ease: 'easeInOut',
                            }
                      }
                    />
                  )}
                />
              }
              className="w-full bg-transparent text-sm outline-none"
            />
            <Combobox.Clear className="text-gray-400 hover:text-gray-600 cursor-pointer rounded p-0.5 transition-colors">
              <CloseIcon className="h-3.5 w-3.5" />
            </Combobox.Clear>
            <Combobox.Icon className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
              <AnimatedChevronsIcon open={open} className="h-4 w-4" />
            </Combobox.Icon>
          </Combobox.InputWrapper>
          <Combobox.Portal>
            <AnimatePresence>
              {open && (
                <Combobox.Positioner
                  side={side}
                  align={align}
                  popupPadding={popupPadding}
                  className="group/positioner"
                >
                  <Combobox.Popup
                    className="rounded-xl shadow-lg border bg-neutral-100"
                    render={
                      <motion.div
                        initial={{
                          opacity: 0,
                          scale: 0.95,
                          filter: 'blur(4px)',
                        }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                      />
                    }
                  >
                    <Combobox.Surface
                      className="group-data-[side=top]/positioner:mb-2 group-data-[side=bottom]/positioner:mt-2"
                      autoHighlightFirst="selected"
                    >
                      <ScrollArea.Root className="h-[calc(var(--spacing)*9*7)] relative">
                        <ScrollArea.Viewport
                          className={cn(
                            'h-full scroll-py-5 scroll-smooth',
                            showScrollGradients && [
                              'before:[--scroll-area-overflow-y-start:inherit] after:[--scroll-area-overflow-y-end:inherit]',
                              'before:block after:block',
                              'before:absolute after:absolute before:left-0 after:left-0 before:top-0 after:bottom-0',
                              'before:w-full after:w-full before:z-10 after:z-10',
                              'before:overscroll-contain after:overscroll-contain',
                              'before:pointer-events-none after:pointer-events-none',
                              'before:bg-gradient-to-b before:from-neutral-100 before:to-transparent',
                              'after:bg-gradient-to-t after:from-neutral-100 after:to-transparent',
                              'before:h-[min(30px,var(--scroll-area-overflow-y-start,0px))] after:h-[min(30px,var(--scroll-area-overflow-y-end,30px))]',
                            ],
                          )}
                        >
                          <Combobox.List render={<ScrollArea.Content />}>
                            <AnimatePresence>
                              {fruits.map((fruit, index) => {
                                const staggerDelay = shouldAnimateItems
                                  ? index * 0.02
                                  : 0
                                const isSelected = value === fruit.value
                                return (
                                  <Combobox.Item
                                    key={fruit.value}
                                    value={fruit.value}
                                    textValue={fruit.label}
                                    className={cn(
                                      'relative flex cursor-pointer items-center justify-between rounded-2xl px-3 h-9',
                                      'text-sm font-medium text-primary/60 data-[highlighted]:text-primary/90 transition-colors',
                                    )}
                                    render={
                                      <motion.div
                                        initial={
                                          shouldAnimateItems
                                            ? { opacity: 0, x: -10 }
                                            : false
                                        }
                                        animate={{
                                          opacity: 1,
                                          x: 0,
                                          transition: {
                                            duration: 0.15,
                                            delay: staggerDelay,
                                            ease: [0.4, 0, 0.2, 1],
                                          },
                                        }}
                                        onAnimationComplete={() => {
                                          if (index === fruits.length - 1) {
                                            setShouldAnimateItems(false)
                                          }
                                        }}
                                      />
                                    }
                                  >
                                    <HighlightIndicator layoutId="combobox-highlight" />
                                    <Combobox.ItemLabel className="relative z-[1]">
                                      {fruit.label}
                                    </Combobox.ItemLabel>
                                    {isSelected && (
                                      <motion.div className="relative z-[1] size-2 bg-blue-500 rounded-full" />
                                    )}
                                  </Combobox.Item>
                                )
                              })}
                            </AnimatePresence>
                          </Combobox.List>
                        </ScrollArea.Viewport>
                        <ScrollArea.Scrollbar
                          orientation="vertical"
                          className="flex w-2 touch-none select-none p-0.5 transition-opacity duration-150 data-[hovering]:opacity-100 data-[scrolling]:opacity-100 opacity-0"
                        >
                          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-neutral-300" />
                        </ScrollArea.Scrollbar>
                      </ScrollArea.Root>
                      <Combobox.Empty className="px-3 py-8 text-center text-sm text-neutral-500">
                        No fruits found
                      </Combobox.Empty>
                    </Combobox.Surface>
                  </Combobox.Popup>
                </Combobox.Positioner>
              )}
            </AnimatePresence>
          </Combobox.Portal>
        </Combobox.Root>
      </div>
    </DemoSection>
  )
}

// --- Multi Combobox Demo ---

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
  ]

  const config = (
    <>
      <ConfigSection title="Behavior">
        <ConfigRow
          label="closeOnSelect"
          description="Close popup after selecting"
        >
          <Toggle checked={closeOnSelect} onChange={setCloseOnSelect} />
        </ConfigRow>
      </ConfigSection>
      <ConfigSection title="Selected Values">
        <div className="flex flex-wrap gap-1">
          {values.length === 0 ? (
            <span className="text-xs text-muted-foreground">None selected</span>
          ) : (
            values.map((v) => (
              <span
                key={v}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {frameworks.find((f) => f.value === v)?.label ?? v}
              </span>
            ))
          )}
        </div>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="combobox-multi"
      component="Combobox"
      title="Multi Select"
      description="Select multiple values with toggle behavior"
      config={config}
    >
      <Combobox.Root
        multiple
        values={values}
        onValuesChange={setValues}
        closeOnSelect={closeOnSelect}
      >
        <div className="relative">
          <Combobox.Input
            placeholder="Select frameworks..."
            className="w-[280px] rounded-md border border-border bg-background px-4 py-2 pr-16 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <Combobox.Clear className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
            <CloseIcon className="h-4 w-4" />
          </Combobox.Clear>
          <Combobox.Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground data-[popup-open]:rotate-180 transition-transform pointer-events-none">
            <ChevronIcon className="h-4 w-4" />
          </Combobox.Icon>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4}>
            <Combobox.Popup className="w-[280px] rounded-lg border border-border bg-popover shadow-lg">
              <Combobox.Surface>
                <Combobox.List className="max-h-[250px] overflow-y-auto p-1 focus:outline-none">
                  {frameworks.map((fw) => (
                    <Combobox.Item
                      key={fw.value}
                      value={fw.value}
                      textValue={fw.label}
                      className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[highlighted]:bg-accent"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded border border-border group-data-[selected]:border-primary group-data-[selected]:bg-primary">
                        <Combobox.ItemIndicator className="text-primary-foreground">
                          <CheckIcon className="h-3 w-3" />
                        </Combobox.ItemIndicator>
                      </span>
                      <Combobox.ItemLabel>{fw.label}</Combobox.ItemLabel>
                    </Combobox.Item>
                  ))}
                </Combobox.List>
                <Combobox.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No frameworks found
                </Combobox.Empty>
              </Combobox.Surface>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </DemoSection>
  )
}

// --- Virtualized Combobox Demo ---

function VirtualizedComboboxDemo() {
  const [value, setValue] = React.useState('')
  const [inputValue, setInputValue] = React.useState('')
  const [scrollElement, setScrollElement] =
    React.useState<HTMLDivElement | null>(null)
  const [itemCount, setItemCount] = React.useState(1000)

  // Generate items
  const allItems = React.useMemo(() => {
    const categories = ['User', 'Project', 'Task', 'Document', 'Event']
    const items: { value: string }[] = []
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
    (_highlightedValue: string | null, index: number) => {
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

  const config = (
    <>
      <ConfigSection title="Virtualizer Config">
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
      </ConfigSection>
      <ConfigSection title="Current State">
        <ConfigRow label="filtered" description="Visible items">
          <span className="text-sm font-mono">
            {filteredItems.length.toLocaleString()}
          </span>
        </ConfigRow>
        <ConfigRow label="value" description="Selected value">
          <span className="text-sm font-mono truncate max-w-[100px]">
            {value || '(none)'}
          </span>
        </ConfigRow>
      </ConfigSection>
    </>
  )

  return (
    <DemoSection
      id="combobox-virtualized"
      component="Combobox"
      title="Virtualized"
      description="Efficiently render thousands of items"
      config={config}
    >
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
            className="w-[300px] rounded-md border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <Combobox.Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground data-[popup-open]:rotate-180 transition-transform pointer-events-none">
            <ChevronIcon className="h-4 w-4" />
          </Combobox.Icon>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4} className="z-50">
            <Combobox.Popup className="w-[300px] rounded-lg border border-border bg-popover shadow-lg">
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
                          className="flex cursor-pointer items-center justify-between rounded-md px-3 text-sm data-[highlighted]:bg-accent"
                        >
                          <span className="capitalize">
                            {item.value.replace('-', ' #')}
                          </span>
                          <Combobox.ItemIndicator className="text-primary">
                            <CheckIcon className="h-4 w-4" />
                          </Combobox.ItemIndicator>
                        </Combobox.Item>
                      )
                    })}
                  </div>
                </Combobox.List>
                <Combobox.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No items found
                </Combobox.Empty>
              </Combobox.Surface>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </DemoSection>
  )
}

// ============================================================================
// Icons
// ============================================================================

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

const CaretRightIcon = ({ className }: { className?: string }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M6 11L6 4L10.5 7.5L6 11Z" fill="currentColor" />
  </svg>
)

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

// ============================================================================
// Main Export
// ============================================================================

export function MenuPlayground() {
  const [activeDemo, setActiveDemo] = React.useState<string | null>(null)
  const [configContent, setConfigContent] =
    React.useState<React.ReactNode>(null)

  return (
    <PlaygroundContext.Provider
      value={{ activeDemo, setActiveDemo, configContent, setConfigContent }}
    >
      <div className="flex flex-1 overflow-hidden relative">
        <TOCSidebar />
        <MainPlayground />
        <FloatingConfigPanel />
      </div>
    </PlaygroundContext.Provider>
  )
}
