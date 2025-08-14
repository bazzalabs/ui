import {
  type ActionMenuContentProps,
  type ActionMenuGroupProps,
  type ActionMenuInputProps,
  type ActionMenuItemProps,
  type ActionMenuListProps,
  ActionMenu as ActionMenuPrimitive,
  type ActionMenuProps,
  type ActionMenuSubContentProps,
  type ActionMenuSubProps,
  type ActionMenuSubTriggerProps,
  type ActionMenuTriggerProps,
} from '@bazza-ui/action-menu'
import { cn } from '@/lib/utils'

const TriangleRightIcon = ({
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
      <path d="M6 11L6 4L10.5 7.5L6 11Z" fill="currentColor"></path>
    </svg>
  )
}

export const ActionMenuRoot = ({ className, ...props }: ActionMenuProps) => {
  return <ActionMenuPrimitive.Root className={cn(className)} {...props} />
}

export const ActionMenuTrigger = ({
  className,
  ...props
}: ActionMenuTriggerProps) => {
  return <ActionMenuPrimitive.Trigger className={cn(className)} {...props} />
}

export const ActionMenuContent = ({
  className,
  ...props
}: ActionMenuContentProps) => {
  return (
    <ActionMenuPrimitive.Content
      className={cn(
        'border bg-popover rounded-md p-1 text-sm shadow-xs',
        className,
      )}
      {...props}
    />
  )
}

export const ActionMenuInput = ({
  className,
  asChild,
  ...props
}: ActionMenuInputProps) => {
  return (
    <ActionMenuPrimitive.Input
      className={cn(
        'outline-hidden disabled:cursor-not-allowed disabled:opacity-50 h-8 px-2 placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground',
        className,
      )}
      placeholder="Search..."
      {...props}
    />
  )
}

export const ActionMenuList = ({
  className,
  ...props
}: ActionMenuListProps) => {
  return <ActionMenuPrimitive.List className={cn(className)} {...props} />
}

export const ActionMenuGroup = ({
  className,
  ...props
}: ActionMenuGroupProps) => {
  return <ActionMenuPrimitive.Group className={cn(className)} {...props} />
}

export const ActionMenuItem = ({
  className,
  ...props
}: ActionMenuItemProps) => {
  return (
    <ActionMenuPrimitive.Item
      className={cn(
        "data-[focused=true]:bg-accent data-[focused=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

export const ActionMenuSub = ({ ...props }: ActionMenuSubProps) => {
  return <ActionMenuPrimitive.Sub {...props} />
}

export const ActionMenuSubTrigger = ({
  className,
  children,
  ...props
}: ActionMenuSubTriggerProps) => {
  return (
    <ActionMenuPrimitive.SubTrigger
      className={cn(
        // "[&_svg:not([class*='text-'])]:text-muted-foreground",
        "group w-full flex items-center justify-between data-[focused=true]:bg-accent data-[focused=true]:text-accent-foreground relative cursor-default gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <TriangleRightIcon className="group text-muted-foreground group-data-[menu-focused=true]:text-foreground" />
    </ActionMenuPrimitive.SubTrigger>
  )
}

export const ActionMenuSubContent = ({
  className,
  ...props
}: ActionMenuSubContentProps) => {
  return (
    <ActionMenuPrimitive.SubContent
      className={cn('bg-popover rounded-md border p-1 shadow-xs', className)}
      {...props}
    />
  )
}

export const ActionMenu = {
  Root: ActionMenuRoot,
  Trigger: ActionMenuTrigger,
  Content: ActionMenuContent,
  Input: ActionMenuInput,
  List: ActionMenuList,
  Group: ActionMenuGroup,
  Item: ActionMenuItem,
  Sub: ActionMenuSub,
  SubTrigger: ActionMenuSubTrigger,
  SubContent: ActionMenuSubContent,
}
