'use client'

import { ScrollArea } from '@base-ui/react/scroll-area'
import {
  DropdownMenu as Primitive,
  useMaybeSubmenuContext,
} from '@bazza-ui/react'
import { cva } from 'class-variance-authority'
import { CheckIcon, ChevronRightIcon } from 'lucide-react'
import type * as React from 'react'
import { Fragment, forwardRef, useCallback } from 'react'
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
    'py-1.5 px-4',
    'w-full relative z-[1]',
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

const listVariants = cva(['py-1 outline-none', '!min-w-full'])

const surfaceVariants = cva('divide-y')

const Root = Primitive.Root

const Trigger = Primitive.Trigger

const Portal = Primitive.Portal

const Positioner = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Positioner>
>(({ className, sideOffset = 8, align: alignProp, ...props }, ref) => {
  const submenuContext = useMaybeSubmenuContext()
  const isSubmenu = !!submenuContext

  const align = alignProp ?? (isSubmenu ? 'list-start' : undefined)

  return (
    <Primitive.Positioner
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      className={cn('z-50', className)}
      {...props}
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
        'min-w-[250px] max-w-[500px]',
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
    /** Maximum height of the scrollable area. */
    maxHeight?: string | number
    /** Whether to show gradient fade at scroll edges. */
    withScrollFade?: boolean
  }
>(({ className, maxHeight = 342, withScrollFade = true, ...props }, ref) => (
  <ScrollArea.Root>
    <ScrollArea.Viewport
      className={scrollAreaViewportVariants({ withScrollFade })}
      style={{
        maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
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
))
List.displayName = 'DropdownMenu.List'

const DataList = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.DataList> & {
    /** Maximum height of the scrollable area. */
    maxHeight?: string | number
    /** Whether to show gradient fade at scroll edges. */
    withScrollFade?: boolean
  }
>(({ className, maxHeight = 342, withScrollFade = true, ...props }, ref) => (
  <ScrollArea.Root>
    <ScrollArea.Viewport
      className={scrollAreaViewportVariants({ withScrollFade })}
      style={{
        maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
      }}
    >
      <Primitive.DataList
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
))
DataList.displayName = 'DropdownMenu.DataList'

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
>(({ className, ...props }, ref) => (
  <Primitive.CheckboxItem
    ref={ref}
    className={cn(menuItemVariants({ variant: 'checkbox' }), className)}
    {...props}
  />
))
CheckboxItem.displayName = 'DropdownMenu.CheckboxItem'

const CheckboxItemIndicator = Primitive.CheckboxItemIndicator

const RadioGroup = Primitive.RadioGroup

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
    className={cn(
      'size-4 flex items-center justify-center shrink-0',
      className,
    )}
    {...props}
  >
    {children ?? <CheckIcon className="size-4 text-primary" />}
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

const Group = Primitive.Group

const GroupLabel = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.GroupLabel>
>(({ className, ...props }, ref) => (
  <Primitive.GroupLabel
    ref={ref}
    className={cn(
      'mt-3 data-[index=0]:mt-1 mb-2',
      'text-xs font-medium text-muted-foreground px-3',
      className,
    )}
    {...props}
  />
))
GroupLabel.displayName = 'DropdownMenu.GroupLabel'

const Submenu = Primitive.Submenu

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
