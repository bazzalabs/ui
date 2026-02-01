'use client'

import { ScrollArea } from '@base-ui/react/scroll-area'
import {
  type DataListChildrenState,
  type DisplayNode,
  DropdownMenu as Primitive,
  useMaybeSubmenuContext,
  useSurfaceContext,
} from '@bazza-ui/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cva } from 'class-variance-authority'
import { CheckIcon, ChevronRightIcon } from 'lucide-react'
import type * as React from 'react'
import { Fragment, forwardRef, useCallback, useEffect, useRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

const scrollAreaViewportVariants = cva('scroll-py-1', {
  variants: {
    withScrollFade: {
      true: [
        // Gradient fade effect using CSS custom properties from Base UI ScrollArea
        'before:[--scroll-area-overflow-y-start:inherit] after:[--scroll-area-overflow-y-end:inherit]',
        'before:block after:block',
        'before:absolute after:absolute before:left-0 after:left-0 before:top-0 after:bottom-0',
        'before:w-full after:w-full before:z-10 after:z-10',
        'before:overscroll-contain after:overscroll-contain',
        'before:pointer-events-none after:pointer-events-none',
        'before:bg-gradient-to-b before:from-popover before:to-transparent',
        'after:bg-gradient-to-t after:from-popover after:to-transparent',
        'before:h-[min(24px,var(--scroll-area-overflow-y-start,0px))] after:h-[min(24px,var(--scroll-area-overflow-y-end,24px))]',
      ],
      false: '',
    },
  },
  defaultVariants: {
    withScrollFade: true,
  },
})

const scrollAreaScrollbarVariants = cva([
  'z-10',
  'flex w-1 touch-none select-none mx-0.5 my-2 bg-border/50 rounded-full',
  'data-[hovering]:opacity-100 hover:w-1.5 data-[scrolling]:opacity-100 opacity-0',
  'transition-[width,opacity] duration-150 ease-out',
])

const scrollAreaThumbVariants = cva(
  'relative flex-1 rounded-full bg-muted-foreground/50',
)

const menuItemVariants = cva(
  [
    // Base styles shared by all menu items
    'group group/row flex items-center text-sm select-none',
    'data-[highlighted]:text-accent-foreground',
    'h-8 px-4',
    'w-full',
    // Clip overflow at row level (like Linear)
    'overflow-hidden',
    'relative z-[1]',
    // Highlight background pseudo-element
    'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
    'data-[highlighted]:before:bg-accent',
  ],
  {
    variants: {
      variant: {
        item: 'gap-2 aria-disabled:opacity-50',
        checkbox: 'gap-2 aria-disabled:opacity-50',
        radio: 'justify-between gap-2 aria-disabled:opacity-50',
        submenuTrigger: [
          'justify-between gap-4 cursor-default',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          'overflow-x-hidden',
        ],
      },
    },
    defaultVariants: {
      variant: 'item',
    },
  },
)

const inputVariants = cva([
  'w-full bg-transparent text-sm outline-none',
  'placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'min-h-9 max-h-9 px-4',
  'caret-blue-500',
])

const listVariants = cva([
  'py-1 outline-none',
  '!min-w-full w-[min(500px,max(var(--row-width),200px))]',
])

const surfaceVariants = cva('divide-y')

function Root({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof Primitive.Root>) {
  const handleOpenChange = useCallback(
    (
      open: boolean,
      eventDetails: Parameters<
        NonNullable<React.ComponentProps<typeof Primitive.Root>['onOpenChange']>
      >[1],
    ) => {
      console.log('[DropdownMenu.Root] onOpenChange:', {
        open,
        reason: eventDetails.reason,
        hasEvent: !!eventDetails.event,
        hasCancel: typeof eventDetails.cancel === 'function',
      })

      // Prevent closing when clicking on feedback toolbar elements
      if (
        !open &&
        (eventDetails.reason === 'outside-press' ||
          eventDetails.reason === 'focus-out') &&
        eventDetails.event
      ) {
        const target = eventDetails.event.target as Element | null
        const feedbackToolbar = target?.closest(
          '[data-feedback-toolbar="true"]',
        )
        console.log('[DropdownMenu.Root] outside-press check:', {
          target: target?.tagName,
          targetClasses: target?.className,
          feedbackToolbar: !!feedbackToolbar,
          feedbackToolbarEl: feedbackToolbar?.tagName,
        })
        if (feedbackToolbar) {
          console.log('[DropdownMenu.Root] Cancelling close!')
          eventDetails.cancel()
          return
        }
      }
      onOpenChange?.(open, eventDetails)
    },
    [onOpenChange],
  )

  return <Primitive.Root onOpenChange={handleOpenChange} {...props} />
}

const Trigger = Primitive.Trigger

const Portal = Primitive.Portal

const Positioner = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Positioner>
>((props, ref) => {
  const submenuContext = useMaybeSubmenuContext()
  const isSubmenu = !!submenuContext

  const {
    className,
    align = isSubmenu ? 'list-start' : 'start',
    sideOffset = isSubmenu ? -2 : 8,
    ...rest
  } = props

  return (
    <Primitive.Positioner
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      className={cn('z-50', className)}
      {...rest}
    />
  )
})
Positioner.displayName = 'DropdownMenu.Positioner'

const Popup = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Popup>
>(({ className, ...props }, ref) => (
  <Primitive.Popup
    ref={ref}
    className={(state) =>
      cn(
        'border bg-popover z-50 rounded-lg text-sm',
        'drop-shadow-xl',
        // 'w-[min(500px,max(var(--row-width),175px))]',
        'overflow-hidden',
        !state.isSubmenu && [
          'opacity-100 scale-100',
          'origin-(--transform-origin)',
          'transition-[opacity,scale] duration-150 ease-out',
          'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
          'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
        ],
        className,
      )
    }
    {...props}
  />
))
Popup.displayName = 'DropdownMenu.Popup'

const Surface = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Surface>
>(({ className, clearSearchOnClose = 'after-exit', ...props }, ref) => (
  <Primitive.Surface
    ref={ref}
    className={cn(surfaceVariants(), className)}
    clearSearchOnClose={clearSearchOnClose}
    {...props}
  />
))
Surface.displayName = 'DropdownMenu.Surface'

const DataSurface = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.DataSurface>
>(({ className, clearSearchOnClose = 'after-exit', ...props }, ref) => (
  <Primitive.DataSurface
    ref={ref}
    className={cn(surfaceVariants(), className)}
    clearSearchOnClose={clearSearchOnClose}
    {...props}
  />
))
DataSurface.displayName = 'DropdownMenu.DataSurface'

const List = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.List> & {
    viewportRef?: React.Ref<HTMLDivElement>
    /** Maximum height of the scrollable area. */
    maxHeight?: string | number
    /** Whether to show gradient fade at scroll edges. */
    withScrollFade?: boolean
  }
>(
  (
    {
      className,
      viewportRef,
      maxHeight = 342,
      withScrollFade = true,
      ...props
    },
    ref,
  ) => (
    <ScrollArea.Root>
      <ScrollArea.Viewport
        ref={viewportRef}
        className={scrollAreaViewportVariants({ withScrollFade })}
        style={{
          maxHeight:
            typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
        }}
      >
        <Primitive.List
          ref={ref}
          className={cn(listVariants(), className)}
          render={<ScrollArea.Content />}
          {...props}
        />
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        orientation="vertical"
        className={scrollAreaScrollbarVariants()}
      >
        <ScrollArea.Thumb className={scrollAreaThumbVariants()} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  ),
)
List.displayName = 'DropdownMenu.List'

export interface DataListProps
  extends Omit<
    React.ComponentProps<typeof Primitive.DataList>,
    'render' | 'children'
  > {
  /** Maximum height of the scrollable area. */
  maxHeight?: string | number
  /** Whether to show gradient fade at scroll edges. */
  withScrollFade?: boolean
  /**
   * Enable virtualization for large lists.
   * When true, only visible items are rendered for better performance.
   */
  virtualized?: boolean
  /**
   * Estimated size of each item in pixels. Used by virtualizer.
   * Only applies when `virtualized` is true.
   * @default 36
   */
  estimateSize?: number
  /**
   * Number of items to render outside the visible area.
   * Only applies when `virtualized` is true.
   * @default 5
   */
  overscan?: number
  /**
   * Content to render inside the list.
   * When virtualized, this can include static elements like Empty.
   * When not virtualized, this should be a render function receiving DataListChildrenState.
   */
  children?:
    | React.ReactNode
    | ((state: DataListChildrenState) => React.ReactNode)
}

const DataList = forwardRef<HTMLDivElement, DataListProps>(
  (
    {
      className,
      maxHeight = 342,
      withScrollFade = true,
      virtualized = false,
      estimateSize = 36,
      overscan = 5,
      children,
      ...props
    },
    ref,
  ) => {
    const maxHeightPx =
      typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight
    const maxHeightNum =
      typeof maxHeight === 'number' ? maxHeight : Number.parseInt(maxHeight, 10)

    if (virtualized) {
      return (
        <ScrollArea.Root>
          <Primitive.DataList
            ref={ref}
            className={cn(listVariants(), className)}
            {...props}
          >
            {(state: DataListChildrenState) => (
              <>
                {/* Render static children like Empty */}
                {typeof children !== 'function' && children}
                <VirtualizedDataListContent
                  state={state}
                  maxHeight={maxHeightNum}
                  estimateSize={estimateSize}
                  overscan={overscan}
                  withScrollFade={withScrollFade}
                />
              </>
            )}
          </Primitive.DataList>
          <ScrollArea.Scrollbar
            orientation="vertical"
            className={scrollAreaScrollbarVariants()}
          >
            <ScrollArea.Thumb className={scrollAreaThumbVariants()} />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      )
    }

    return (
      <ScrollArea.Root>
        <ScrollArea.Viewport
          className={scrollAreaViewportVariants({ withScrollFade })}
          style={{ maxHeight: maxHeightPx }}
        >
          <Primitive.DataList
            ref={ref}
            className={cn(listVariants(), className)}
            render={<ScrollArea.Content />}
            {...props}
          >
            {children as (state: DataListChildrenState) => React.ReactNode}
          </Primitive.DataList>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="vertical"
          className={scrollAreaScrollbarVariants()}
        >
          <ScrollArea.Thumb className={scrollAreaThumbVariants()} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    )
  },
)
DataList.displayName = 'DropdownMenu.DataList'

// ============================================================================
// Virtualized DataList Content (internal)
// ============================================================================

interface VirtualizedDataListContentProps {
  state: DataListChildrenState
  maxHeight: number
  estimateSize: number
  overscan: number
  withScrollFade: boolean
}

function VirtualizedDataListContent({
  state,
  maxHeight,
  estimateSize,
  overscan,
  withScrollFade,
}: VirtualizedDataListContentProps) {
  const { nodes, renderNode } = state
  const { store } = useSurfaceContext()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Get the highlighted item ID from store for scroll sync
  const highlightedId = store.useState('highlightedId')

  // Create stable key function
  const getItemKey = useCallback(
    (index: number) => {
      const node = nodes[index]
      if (!node) return index
      return getNodeKey(node)
    },
    [nodes],
  )

  // Create virtualizer
  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => estimateSize,
    getItemKey,
    overscan,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  // Sync scroll position when highlighted item changes via keyboard
  useEffect(() => {
    if (!highlightedId) return

    // Find the index of the highlighted item
    const index = nodes.findIndex((node) => {
      const key = getNodeKey(node)
      return key === highlightedId
    })

    if (index !== -1) {
      virtualizer.scrollToIndex(index, { align: 'auto' })
    }
  }, [highlightedId, nodes, virtualizer])

  // Register list ref with store for scroll behavior
  useEffect(() => {
    store.setListRef(scrollContainerRef as React.RefObject<HTMLElement | null>)
  }, [store, scrollContainerRef])

  return (
    <ScrollArea.Viewport
      ref={scrollContainerRef}
      className={scrollAreaViewportVariants({ withScrollFade })}
      style={{ maxHeight: `${maxHeight}px` }}
    >
      <ScrollArea.Content
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const node = nodes[virtualItem.index]
          if (!node) return null

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderNode(node)}
            </div>
          )
        })}
      </ScrollArea.Content>
    </ScrollArea.Viewport>
  )
}

/**
 * Get a unique key for a display node.
 * Prefers compositeId (includes breadcrumb path) for row nodes.
 */
function getNodeKey(node: DisplayNode): string {
  // Handle row nodes (items, checkbox items, submenus)
  // Prefer compositeId which includes breadcrumb path for deep search results
  if ('node' in node && node.node) {
    return node.compositeId ?? node.node.id ?? node.node.value
  }

  // Handle group nodes
  if ('group' in node && node.group) {
    return node.group.id
  }

  // Handle radio group nodes
  if ('radioGroup' in node && node.radioGroup) {
    return node.radioGroup.id
  }

  // Handle separator nodes
  if ('separator' in node && node.separator) {
    return node.separator.id ?? 'separator'
  }

  return String(Math.random())
}

const Input = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Primitive.Input>
>(({ className, placeholder = 'Search...', ...props }, ref) => (
  <Primitive.Input
    ref={ref}
    className={cn(inputVariants(), className)}
    placeholder={placeholder}
    {...props}
  />
))
Input.displayName = 'DropdownMenu.Input'

const DataInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Primitive.DataInput>
>(({ className, placeholder = 'Search...', ...props }, ref) => (
  <Primitive.DataInput
    ref={ref}
    className={cn(inputVariants(), className)}
    placeholder={placeholder}
    {...props}
  />
))
DataInput.displayName = 'DropdownMenu.DataInput'

const Item = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Item>
>(({ className, ...props }, ref) => (
  <Primitive.Item
    ref={ref}
    className={cn(menuItemVariants({ variant: 'item' }), className)}
    {...props}
  />
))
Item.displayName = 'DropdownMenu.Item'

const CheckboxItem = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.CheckboxItem>
>(({ className, checked, onCheckedChange, children, ...props }, ref) => (
  <Primitive.CheckboxItem
    ref={ref}
    checked={checked}
    onCheckedChange={onCheckedChange}
    className={cn(menuItemVariants({ variant: 'checkbox' }), className)}
    {...props}
  >
    {children}
  </Primitive.CheckboxItem>
))
CheckboxItem.displayName = 'DropdownMenu.CheckboxItem'

const CheckboxItemIndicator = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.CheckboxItemIndicator>
>(({ className, keepMounted = true, ...props }, ref) => (
  <Primitive.CheckboxItemIndicator
    ref={ref}
    className={cn(
      'flex items-center justify-center shrink-0 relative',
      "after:absolute after:inset-x-0 after:-inset-y-2 after:content-['']",
      className,
    )}
    keepMounted={keepMounted}
    render={(props, state) => (
      <Checkbox
        {...props}
        checked={state.checked}
        onClick={(e) => {
          e.stopPropagation()
          state.toggle()
        }}
      />
    )}
    {...props}
  />
))

const RadioGroup = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.RadioGroup>
>(({ className, ...props }, ref) => (
  <Primitive.RadioGroup
    ref={ref}
    className={cn(
      'first:[&_[bazzaui-dropdown-menu-group-label]]:mt-2',
      className,
    )}
    {...props}
  />
))

const RadioGroupValue = Primitive.RadioGroupValue

const RadioItem = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.RadioItem>
>(({ className, ...props }, ref) => (
  <Primitive.RadioItem
    ref={ref}
    className={cn(menuItemVariants({ variant: 'radio' }), className)}
    {...props}
  />
))
RadioItem.displayName = 'DropdownMenu.RadioItem'

const RadioItemIndicator = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Primitive.RadioItemIndicator>
>(({ className, children, ...props }, ref) => (
  <Primitive.RadioItemIndicator
    ref={ref}
    keepMounted
    className={cn(
      'size-4 flex items-center justify-center shrink-0 text-transparent data-checked:text-primary/75 data-checked:data-highlighted:text-primary',
      className,
    )}
    {...props}
  >
    {children ?? <CheckIcon className="size-5 shrink-0 " />}
  </Primitive.RadioItemIndicator>
))
RadioItemIndicator.displayName = 'DropdownMenu.RadioItemIndicator'

const Separator = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Separator>
>(({ className, ...props }, ref) => (
  <Primitive.Separator
    ref={ref}
    className={cn('h-px w-full bg-border my-1', className)}
    {...props}
  />
))
Separator.displayName = 'DropdownMenu.Separator'

const Group = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Group>
>(({ className, ...props }, ref) => (
  <Primitive.Group
    ref={ref}
    className={cn(
      'first:[&_[bazzaui-dropdown-menu-group-label]]:mt-1',
      className,
    )}
    {...props}
  />
))
Group.displayName = 'DropdownMenu.Group'

const GroupLabel = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.GroupLabel>
>(({ className, ...props }, ref) => (
  <Primitive.GroupLabel
    ref={ref}
    className={cn(
      'mt-3 mb-1',
      'text-xs font-medium text-muted-foreground px-4',
      className,
    )}
    {...props}
  />
))
GroupLabel.displayName = 'DropdownMenu.GroupLabel'

function Submenu({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof Primitive.Submenu>) {
  const handleOpenChange = useCallback(
    (
      open: boolean,
      eventDetails: Parameters<
        NonNullable<
          React.ComponentProps<typeof Primitive.Submenu>['onOpenChange']
        >
      >[1],
    ) => {
      console.log('[DropdownMenu.Submenu] onOpenChange:', {
        open,
        reason: eventDetails.reason,
        hasEvent: !!eventDetails.event,
        hasCancel: typeof eventDetails.cancel === 'function',
      })

      // Prevent closing when clicking on feedback toolbar elements
      if (
        !open &&
        (eventDetails.reason === 'outside-press' ||
          eventDetails.reason === 'focus-out') &&
        eventDetails.event
      ) {
        const target = eventDetails.event.target as Element | null
        const feedbackToolbar = target?.closest(
          '[data-feedback-toolbar="true"]',
        )
        console.log('[DropdownMenu.Submenu] outside-press check:', {
          target: target?.tagName,
          targetClasses: target?.className,
          feedbackToolbar: !!feedbackToolbar,
        })
        if (feedbackToolbar) {
          console.log('[DropdownMenu.Submenu] Cancelling close!')
          eventDetails.cancel()
          return
        }
      }
      onOpenChange?.(open, eventDetails)
    },
    [onOpenChange],
  )

  return <Primitive.Submenu onOpenChange={handleOpenChange} {...props} />
}

const SubmenuTrigger = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.SubmenuTrigger>
>(({ className, children, ...props }, ref) => (
  <Primitive.SubmenuTrigger
    ref={ref}
    className={cn(menuItemVariants({ variant: 'submenuTrigger' }), className)}
    {...props}
  >
    {children}

    <Primitive.SubmenuTriggerIndicator
      className={cn(
        'size-4 shrink-0 text-muted-foreground/50',
        'group-data-[popup-open]/row:text-muted-foreground',
        'group-data-[popup-open]/row:group-data-[popup-focused]/row:text-foreground',
        'transition-colors duration-50 ease-out',
      )}
    >
      <TriangleRightIcon className="size-4" />
    </Primitive.SubmenuTriggerIndicator>
  </Primitive.SubmenuTrigger>
))
SubmenuTrigger.displayName = 'DropdownMenu.SubmenuTrigger'

const SubmenuTriggerIndicator = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Primitive.SubmenuTriggerIndicator>
>(({ className, children, ...props }, ref) => (
  <Primitive.SubmenuTriggerIndicator
    ref={ref}
    className={cn(
      'size-4 shrink-0 text-muted-foreground/50',
      'group-data-[popup-open]/row:text-muted-foreground',
      'group-data-[highlighted]/row:text-foreground',
      'transition-colors duration-50 ease-out',
      className,
    )}
    {...props}
  >
    {children ?? <TriangleRightIcon className="size-4" />}
  </Primitive.SubmenuTriggerIndicator>
))
SubmenuTriggerIndicator.displayName = 'DropdownMenu.SubmenuTriggerIndicator'

const Empty = forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof Primitive.Empty>, 'children'> & {
    children?: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <Primitive.Empty
    ref={ref}
    className={cn(
      'flex items-center justify-center h-10 text-muted-foreground text-sm',
      className,
    )}
    {...props}
  >
    {children ?? 'No matching options.'}
  </Primitive.Empty>
))
Empty.displayName = 'DropdownMenu.Empty'

const Arrow = Primitive.Arrow

const Backdrop = Primitive.Backdrop

const Shortcut = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Primitive.Shortcut>
>(({ className, ...props }, ref) => (
  <Primitive.Shortcut
    ref={ref}
    className={cn('ml-auto text-xs text-muted-foreground', className)}
    {...props}
  />
))
Shortcut.displayName = 'DropdownMenu.Shortcut'

const Icon = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Primitive.Icon>
>(({ className, ...props }, ref) => (
  <Primitive.Icon
    ref={ref}
    className={cn(
      'min-h-4 min-w-4 size-4 flex items-center justify-center shrink-0',
      'text-muted-foreground group-data-[highlighted]/row:text-primary',
      className,
    )}
    {...props}
  />
))
Icon.displayName = 'DropdownMenu.Icon'

const ScrollUpArrow = Primitive.ScrollUpArrow

const ScrollDownArrow = Primitive.ScrollDownArrow

// ============================================================================
// Compound Export
// ============================================================================

export const DropdownMenu = {
  Root,
  Trigger,
  Portal,
  Positioner,
  Popup,
  Surface,
  DataSurface,
  List,
  DataList,
  Input,
  DataInput,
  Item,
  CheckboxItem,
  CheckboxItemIndicator,
  RadioGroup,
  RadioGroupValue,
  RadioItem,
  RadioItemIndicator,
  Separator,
  Group,
  GroupLabel,
  Submenu,
  SubmenuTrigger,
  SubmenuTriggerIndicator,
  Empty,
  Arrow,
  Backdrop,
  Shortcut,
  Icon,
  ScrollUpArrow,
  ScrollDownArrow,
}

// ============================================================================
// Utility Components
// ============================================================================

// Triangle Right Icon (for submenu indicators)
export const TriangleRightIcon = ({
  ...props
}: React.HTMLAttributes<SVGSVGElement>) => {
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

// Diamond Spinner (loading indicator)
const diamondCoords = [
  { x: 3, y: 48 },
  { x: 18, y: 33 },
  { x: 18, y: 48 },
  { x: 18, y: 63 },
  { x: 33, y: 48 },
  { x: 33, y: 18 },
  { x: 33, y: 33 },
  { x: 33, y: 63 },
  { x: 33, y: 78 },
  { x: 48, y: 3 },
  { x: 48, y: 18 },
  { x: 48, y: 33 },
  { x: 48, y: 48 },
  { x: 48, y: 63 },
  { x: 48, y: 78 },
  { x: 48, y: 93 },
  { x: 63, y: 18 },
  { x: 63, y: 33 },
  { x: 63, y: 48 },
  { x: 63, y: 63 },
  { x: 63, y: 78 },
  { x: 78, y: 33 },
  { x: 78, y: 48 },
  { x: 78, y: 63 },
  { x: 93, y: 48 },
] as const

export const DiamondSpinner = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const getRectProps = useCallback(
    (size: number, coord: { x: number; y: number }) => {
      return {
        x: coord.x - size / 2,
        y: coord.y - size / 2,
        width: size,
        height: size,
      }
    },
    [],
  )

  return (
    <svg
      className={cn('fill-current size-6', className)}
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <style>
        {`
          @keyframes diamond-spin {
            25% { transform: translate(30px, -30px); }
            50% { transform: translate(60px, 0px); }
            75% { transform: translate(30px, 30px); }
          }
        `}
      </style>
      {/* Background squares */}
      {diamondCoords.map((c) => (
        <rect
          key={`bg-${c.x}-${c.y}`}
          className="fill-current/30"
          {...getRectProps(7, c)}
        />
      ))}
      {/* Animated squares */}
      <g style={{ animation: 'diamond-spin 1.4s steps(2, end) infinite' }}>
        {diamondCoords.slice(0, 5).map((c) => (
          <rect key={`fg-${c.x}-${c.y}`} {...getRectProps(9, c)} />
        ))}
      </g>
    </svg>
  )
}

// Label with Breadcrumbs (for search results showing path)
export const LabelWithBreadcrumbs = ({
  label,
  breadcrumbs,
  classNames,
}: {
  label: React.ReactNode
  breadcrumbs?: string[]
  classNames?: {
    label?: string
    breadcrumb?: string
    separator?: string
  }
}) => (
  <div className="flex items-center gap-1 truncate">
    {breadcrumbs?.map((crumb, idx) => (
      <Fragment key={`${idx}-${crumb}`}>
        <span
          className={cn(
            'text-muted-foreground truncate',
            classNames?.breadcrumb,
          )}
        >
          {crumb}
        </span>
        <ChevronRightIcon
          className={cn(
            'size-3 text-muted-foreground/75 stroke-[2.5px] shrink-0',
            classNames?.separator,
          )}
        />
      </Fragment>
    ))}
    <span
      className={cn(
        'truncate',
        'text-primary/90 group-data-[highlighted]/row:text-primary',
        classNames?.label,
      )}
    >
      {label}
    </span>
  </div>
)

// Check Icon (for radio items)
export { CheckIcon }
