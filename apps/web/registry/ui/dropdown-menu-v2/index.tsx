'use client'

import { cn } from '@/lib/utils'
import { DropdownMenu as Primitive } from '@bazza-ui/dropdown-menu-v2'

export const DropdownMenuRoot = Primitive.Root

export const DropdownMenuTrigger = Primitive.Trigger

export const DropdownMenuPortal = Primitive.Portal

export const DropdownMenuBackdrop = Primitive.Backdrop

export const DropdownMenuPositioner = Primitive.Positioner

export const DropdownMenuSurface = ({
  className,
  ...props
}: Primitive.Surface.Props) => (
  <Primitive.Surface
    className={cn(
      'border bg-popover z-50 rounded-lg flex flex-col text-sm',
      'drop-shadow-xl',
      className,
    )}
    {...props}
  />
)

export const DropdownMenuHeader = Primitive.Header

export const DropdownMenuInput = ({
  className,
  ...props
}: Primitive.Input.Props) => (
  <Primitive.Input
    className={cn(
      'outline-hidden disabled:cursor-not-allowed disabled:opacity-50 min-h-9 max-h-9 px-4 border-b',
      'placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out',
      'caret-blue-500',
      'w-full',
      className,
    )}
    {...props}
  />
)

export const DropdownMenuList = ({
  className,
  ...props
}: Primitive.List.Props) => (
  <Primitive.List
    className={cn(
      'scroll-py-1 overflow-y-auto overflow-x-hidden outline-none',
      '[-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
      'w-full flex-1',
      'py-1',
      className,
    )}
    {...props}
  />
)

export const DropdownMenuItem = ({
  className,
  ...props
}: Primitive.Item.Props) => (
  <Primitive.Item
    className={cn(
      'group flex items-center gap-2 text-sm select-none aria-disabled:opacity-50',
      'data-[highlighted]:not-disabled:text-accent-foreground',
      'py-1.5 px-4',
      'w-full relative z-1',
      'before:absolute before:top-0 before:left-1 before:right-1 before:h-full data-[highlighted]:not-disabled:before:bg-accent before:rounded-md before:z-[-1]',
      className,
    )}
    {...props}
  />
)

export const DropdownMenu = {
  Root: DropdownMenuRoot,
  Trigger: DropdownMenuTrigger,
  Portal: DropdownMenuPortal,
  Positioner: DropdownMenuPositioner,
  Surface: DropdownMenuSurface,
  Header: DropdownMenuHeader,
  Input: DropdownMenuInput,
  List: DropdownMenuList,
  Item: DropdownMenuItem,
}
