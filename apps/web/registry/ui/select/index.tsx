'use client'

import { ScrollArea } from '@base-ui/react/scroll-area'
import { Select as Primitive } from '@bazza-ui/react/select'
import { cva } from 'class-variance-authority'
import { CheckIcon } from 'lucide-react'
import type * as React from 'react'
import { forwardRef } from 'react'
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

const itemVariants = cva([
  // Base styles shared by all items
  'group group/row flex items-center text-sm select-none',
  'data-[highlighted]:text-accent-foreground',
  'h-8 px-4',
  'w-full',
  // Clip overflow at row level
  'overflow-hidden',
  'relative z-[1]',
  // Highlight background pseudo-element
  'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
  'data-[highlighted]:before:bg-accent',
  // Item-specific
  'justify-between gap-2 aria-disabled:opacity-50',
])

const inputVariants = cva([
  'w-full bg-transparent text-sm outline-none',
  'placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'min-h-9 max-h-9 px-4',
  'caret-blue-500',
])

const listVariants = cva(['py-1 outline-none'])

const surfaceVariants = cva('divide-y')

const Root = Primitive.Root

const Trigger = Primitive.Trigger

const Value = Primitive.Value

const Portal = Primitive.Portal

const Positioner = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Positioner>
>((props, ref) => {
  const {
    className,
    sideOffset = 8,
    alignItemWithTrigger = true,
    ...rest
  } = props

  return (
    <Primitive.Positioner
      ref={ref}
      sideOffset={sideOffset}
      alignItemWithTrigger={alignItemWithTrigger}
      className={cn('z-50 group/positioner', className)}
      {...rest}
    />
  )
})
Positioner.displayName = 'Select.Positioner'

const Popup = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Popup>
>(({ className, ...props }, ref) => (
  <Primitive.Popup
    ref={ref}
    className={(state) =>
      cn(
        'border bg-popover z-50 rounded-lg text-sm',
        'min-w-[200px] max-w-[500px] w-full',
        'drop-shadow-xl',
        'overflow-hidden',
        state.side !== 'none' && [
          'origin-(--transform-origin)',
          'opacity-100 scale-100',
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
Popup.displayName = 'Select.Popup'

const Surface = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Surface>
>(({ className, ...props }, ref) => (
  <Primitive.Surface
    ref={ref}
    className={cn(surfaceVariants(), className)}
    clearSearchOnClose="after-exit"
    autoHighlightFirst="selected"
    {...props}
  />
))
Surface.displayName = 'Select.Surface'

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
List.displayName = 'Select.List'

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
Input.displayName = 'Select.Input'

const Item = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Item>
>(({ className, ...props }, ref) => (
  <Primitive.Item
    ref={ref}
    className={cn(itemVariants(), className)}
    {...props}
  />
))
Item.displayName = 'Select.Item'

const ItemIndicator = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Primitive.ItemIndicator>
>(({ className, children, ...props }, ref) => (
  <Primitive.ItemIndicator
    ref={ref}
    keepMounted
    className={cn(
      'size-4 flex items-center justify-center shrink-0 text-transparent data-[selected]:text-primary/75 data-[selected]:data-[highlighted]:text-primary',
      className,
    )}
    {...props}
  >
    {children ?? <CheckIcon className="size-5 shrink-0" />}
  </Primitive.ItemIndicator>
))
ItemIndicator.displayName = 'Select.ItemIndicator'

const ItemLabel = Primitive.ItemLabel

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
Separator.displayName = 'Select.Separator'

const Group = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Group>
>(({ className, ...props }, ref) => (
  <Primitive.Group
    ref={ref}
    className={cn('first:[&_[bazzaui-select-group-label]]:mt-1', className)}
    {...props}
  />
))
Group.displayName = 'Select.Group'

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
GroupLabel.displayName = 'Select.GroupLabel'

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
Empty.displayName = 'Select.Empty'

const Arrow = Primitive.Arrow

const Backdrop = Primitive.Backdrop

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
Icon.displayName = 'Select.Icon'

const ScrollUpArrow = Primitive.ScrollUpArrow

const ScrollDownArrow = Primitive.ScrollDownArrow

// ============================================================================
// Compound Export
// ============================================================================

export const Select = {
  Root,
  Trigger,
  Value,
  Portal,
  Positioner,
  Popup,
  Surface,
  List,
  Input,
  Item,
  ItemIndicator,
  ItemLabel,
  Separator,
  Group,
  GroupLabel,
  Empty,
  Arrow,
  Backdrop,
  Icon,
  ScrollUpArrow,
  ScrollDownArrow,
}

// Re-export CheckIcon for convenience
export { CheckIcon }
