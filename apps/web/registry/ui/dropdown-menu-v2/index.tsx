'use client'

import {
  DropdownMenu as Primitive,
  useMaybeSubmenuContext,
} from '@bazza-ui/react'
import { CheckIcon, ChevronRightIcon } from 'lucide-react'
import type * as React from 'react'
import { Fragment, forwardRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Re-export types from @bazza-ui/react for convenience
// ============================================================================

export type {
  // Data-First API types
  CheckboxItemDef,
  CheckboxItemRenderParams,
  DataListChildrenState,
  DisplayGroupNode,
  DisplayNode,
  DisplayRadioGroupNode,
  DisplayRowNode,
  // Event types
  DropdownMenuArrowProps,
  DropdownMenuBackdropProps,
  DropdownMenuCheckboxItemIndicatorProps,
  DropdownMenuCheckboxItemProps,
  DropdownMenuDataInputProps,
  DropdownMenuDataListProps,
  DropdownMenuDataSurfaceProps,
  DropdownMenuEmptyProps,
  DropdownMenuGroupLabelProps,
  DropdownMenuGroupProps,
  DropdownMenuIconProps,
  DropdownMenuInputProps,
  DropdownMenuItemProps,
  DropdownMenuListProps,
  DropdownMenuPopupProps,
  DropdownMenuPortalProps,
  DropdownMenuPositionerProps,
  DropdownMenuRadioGroupProps,
  DropdownMenuRadioGroupValueProps,
  DropdownMenuRadioItemIndicatorProps,
  DropdownMenuRadioItemProps,
  DropdownMenuSeparatorProps,
  DropdownMenuShortcutProps,
  DropdownMenuSubmenuTriggerIndicatorProps,
  DropdownMenuSubmenuTriggerProps,
  DropdownMenuSurfaceProps,
  GroupDef,
  GroupRenderParams,
  ItemDef,
  ItemRenderParams,
  NodeDef,
  RadioGroupDef,
  RadioGroupRenderParams,
  RowRenderContext,
  SeparatorDef,
  SubmenuDef,
  SubmenuRenderParams,
} from '@bazza-ui/react'

export {
  defineRadioGroup,
  // Utilities
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplayRowNode,
  // Context hooks
  useItemContext,
  useMaybeItemContext,
  useMaybeRootContext,
  useMaybeSurfaceContext,
  useRootContext,
  useSurfaceContext,
} from '@bazza-ui/react'

// ============================================================================
// Styled Components
// ============================================================================

// Root - no styling needed, just re-export
const Root = Primitive.Root

// Trigger - no default styling, just re-export
const Trigger = Primitive.Trigger

// Portal - no styling needed
const Portal = Primitive.Portal

// Positioner
const Positioner = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Positioner>
>(({ className, sideOffset = 8, align: alignProp, ...props }, ref) => {
  const submenuContext = useMaybeSubmenuContext()
  const isSubmenu = !!submenuContext

  // Default align: 'list-start' for submenus, undefined (let base handle it) for root
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

// Popup
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
          // Base styles (final state)
          'opacity-100 scale-100',
          'origin-(--transform-origin)',
          'transition-[opacity,scale] duration-150 ease-out',
          // Enter animation: @starting-style defines initial state
          'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
          // Exit animation: data-[ending-style] defines final state
          'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
        ],
        className,
      )
    }
    {...props}
  />
))
Popup.displayName = 'DropdownMenu.Popup'

// Surface
const Surface = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Surface>
>(({ className, clearSearchOnClose = 'after-exit', ...props }, ref) => (
  <Primitive.Surface
    ref={ref}
    className={className}
    clearSearchOnClose={clearSearchOnClose}
    {...props}
  />
))
Surface.displayName = 'DropdownMenu.Surface'

// DataSurface
const DataSurface = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.DataSurface>
>(({ className, clearSearchOnClose = 'after-exit', ...props }, ref) => (
  <Primitive.DataSurface
    ref={ref}
    className={className}
    clearSearchOnClose={clearSearchOnClose}
    {...props}
  />
))
DataSurface.displayName = 'DropdownMenu.DataSurface'

// List
const List = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.List>
>(({ className, ...props }, ref) => (
  <Primitive.List
    ref={ref}
    className={cn(
      'scroll-py-1 overflow-y-auto overflow-x-hidden outline-none',
      'w-full max-h-[500px]',
      'py-1',
      className,
    )}
    {...props}
  />
))
List.displayName = 'DropdownMenu.List'

// DataList
const DataList = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.DataList>
>(({ className, ...props }, ref) => (
  <Primitive.DataList
    ref={ref}
    className={cn(
      'scroll-py-1 overflow-y-auto overflow-x-hidden outline-none',
      'w-full flex-1 min-h-0',
      'py-1',
      className,
    )}
    {...props}
  />
))
DataList.displayName = 'DropdownMenu.DataList'

// Input
const Input = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Primitive.Input>
>(({ className, placeholder = 'Search...', ...props }, ref) => (
  <Primitive.Input
    ref={ref}
    className={cn(
      'w-full bg-transparent text-sm outline-none',
      'placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'min-h-9 max-h-9 px-4 border-b',
      'caret-blue-500',
      className,
    )}
    placeholder={placeholder}
    {...props}
  />
))
Input.displayName = 'DropdownMenu.Input'

// DataInput
const DataInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Primitive.DataInput>
>(({ className, placeholder = 'Search...', ...props }, ref) => (
  <Primitive.DataInput
    ref={ref}
    className={cn(
      'w-full bg-transparent text-sm outline-none',
      'placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'min-h-9 max-h-9 px-4 border-b',
      'caret-blue-500',
      className,
    )}
    placeholder={placeholder}
    {...props}
  />
))
DataInput.displayName = 'DropdownMenu.DataInput'

// Item
const Item = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Item>
>(({ className, ...props }, ref) => (
  <Primitive.Item
    ref={ref}
    className={cn(
      'group group/row flex items-center gap-2 text-sm select-none',
      'data-[highlighted]:text-accent-foreground',
      'aria-disabled:opacity-50',
      'py-1.5 px-4',
      'w-full relative z-[1]',
      'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
      'data-[highlighted]:before:bg-accent',
      className,
    )}
    {...props}
  />
))
Item.displayName = 'DropdownMenu.Item'

// CheckboxItem
const CheckboxItem = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.CheckboxItem>
>(({ className, ...props }, ref) => (
  <Primitive.CheckboxItem
    ref={ref}
    className={cn(
      'group group/row flex items-center gap-2 text-sm select-none',
      'data-[highlighted]:text-accent-foreground',
      'aria-disabled:opacity-50',
      'py-1.5 px-4',
      'w-full relative z-[1]',
      'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
      'data-[highlighted]:before:bg-accent',
      className,
    )}
    {...props}
  />
))
CheckboxItem.displayName = 'DropdownMenu.CheckboxItem'

// CheckboxItemIndicator
const CheckboxItemIndicator = Primitive.CheckboxItemIndicator

// RadioGroup
const RadioGroup = Primitive.RadioGroup

// RadioGroupValue (for Data-First API)
const RadioGroupValue = Primitive.RadioGroupValue

// RadioItem
const RadioItem = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.RadioItem>
>(({ className, ...props }, ref) => (
  <Primitive.RadioItem
    ref={ref}
    className={cn(
      'group group/row flex items-center justify-between gap-2 text-sm select-none',
      'data-[highlighted]:text-accent-foreground',
      'aria-disabled:opacity-50',
      'py-1.5 px-4',
      'w-full relative z-[1]',
      'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
      'data-[highlighted]:before:bg-accent',
      className,
    )}
    {...props}
  />
))
RadioItem.displayName = 'DropdownMenu.RadioItem'

// RadioItemIndicator
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

// Separator
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

// Group
const Group = Primitive.Group

// GroupLabel
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

// Submenu
const Submenu = Primitive.Submenu

// SubmenuTrigger
const SubmenuTrigger = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.SubmenuTrigger>
>(({ className, children, ...props }, ref) => (
  <Primitive.SubmenuTrigger
    ref={ref}
    className={cn(
      'group group/row flex items-center justify-between gap-4 text-sm select-none cursor-default',
      'data-[highlighted]:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'py-1.5 px-4',
      'overflow-x-hidden w-full relative z-[1]',
      'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
      'data-[highlighted]:before:bg-accent',
      className,
    )}
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

// SubmenuTriggerIndicator
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

// Empty
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

// Arrow
const Arrow = Primitive.Arrow

// Backdrop
const Backdrop = Primitive.Backdrop

// Shortcut
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

// Icon
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

// ScrollUpArrow
const ScrollUpArrow = Primitive.ScrollUpArrow

// ScrollDownArrow
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
