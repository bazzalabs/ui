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
        'border bg-popover z-50 rounded-md text-sm shadow-xs origin-(--radix-popper-transform-origin) flex flex-col h-full w-full',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
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
    <>
      <ActionMenuPrimitive.Input
        className={cn(
          'outline-hidden disabled:cursor-not-allowed disabled:opacity-50 h-9 px-4 placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out',
          className,
        )}
        placeholder="Search..."
        {...props}
      />
      <div className="h-px w-full bg-border" />
    </>
  )
}

export const ActionMenuList = ({
  className,
  ...props
}: ActionMenuListProps) => {
  return (
    <ActionMenuPrimitive.List
      className={cn(
        'p-1 flex flex-col w-full max-w-[500px] max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto',
        className,
      )}
      {...props}
    />
  )
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
}: ActionMenuItemProps) => (
  <ActionMenuPrimitive.Item
    {...props}
    className={cn(
      'group flex items-center justify-between gap-4 rounded-sm px-3 py-1.5 text-sm',
      'data-[focused=true]:bg-accent data-[focused=true]:text-accent-foreground',
      className,
    )}
  />
)

export const ActionMenuSub = ({ ...props }: ActionMenuSubProps) => {
  return <ActionMenuPrimitive.Sub {...props} />
}

export const ActionMenuSubTrigger = ({
  className,
  children,
  ...props
}: ActionMenuSubTriggerProps) => (
  <ActionMenuPrimitive.SubTrigger
    {...props}
    className={cn(
      className,
      "group w-full flex items-center justify-between data-[focused=true]:bg-accent data-[focused=true]:text-accent-foreground relative cursor-default gap-4 rounded-sm px-3 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
    )}
  >
    {children}
    <TriangleRightIcon className="text-muted-foreground group-data-[menu-focused=true]:text-foreground transition-[color] duration-50 ease-out" />
  </ActionMenuPrimitive.SubTrigger>
)

export const ActionMenuSubContent = ({
  className,
  ...props
}: ActionMenuSubContentProps) => {
  return (
    <ActionMenuPrimitive.SubContent
      className={cn(
        'bg-popover z-50 rounded-md border shadow-xs flex flex-col h-full w-full',
        className,
      )}
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
