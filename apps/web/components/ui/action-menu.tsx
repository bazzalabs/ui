import {
  __ItemImpl,
  __SubTriggerImpl,
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
  ComponentsProvider,
  toRenderFn,
} from '@bazza-ui/action-menu'
import { forwardRef } from 'react'
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

const StyledItem = forwardRef<HTMLDivElement, ActionMenuItemProps>(
  ({ className, ...props }, ref) => (
    <__ItemImpl
      ref={ref}
      className={cn(
        "data-[focused=true]:bg-accent data-[focused=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-3 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  ),
)
StyledItem.displayName = 'ActionMenuStyled.Item'

const StyledSubTrigger = forwardRef<HTMLDivElement, ActionMenuSubTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const render = toRenderFn(children)
    return (
      <__SubTriggerImpl
        ref={ref}
        className={cn(
          "group w-full flex items-center justify-between data-[focused=true]:bg-accent data-[focused=true]:text-accent-foreground relative cursor-default gap-2 rounded-sm px-3 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {(ctx) => (
          <>
            {render(ctx)}
            <TriangleRightIcon className="text-muted-foreground group-data-[menu-focused=true]:text-foreground transition-[color] duration-50 ease-out" />
          </>
        )}
      </__SubTriggerImpl>
    )
  },
)
StyledSubTrigger.displayName = 'ActionMenuStyled.SubTrigger'

export const ActionMenuRoot = ({ className, ...props }: ActionMenuProps) => {
  return (
    <ComponentsProvider
      components={{ Item: StyledItem, SubTrigger: StyledSubTrigger }}
    >
      <ActionMenuPrimitive.Root className={cn(className)} {...props} />
    </ComponentsProvider>
  )
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
    <ActionMenuPrimitive.Input
      className={cn(
        'outline-hidden disabled:cursor-not-allowed disabled:opacity-50 h-9 px-4 placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out',
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
  return (
    <ActionMenuPrimitive.List
      className={cn(
        'p-1 flex flex-col w-full max-w-[300px] max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto',
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

export const ActionMenuItem = (props: ActionMenuItemProps) => (
  <ActionMenuPrimitive.Item {...props} />
)

export const ActionMenuSub = ({ ...props }: ActionMenuSubProps) => {
  return <ActionMenuPrimitive.Sub {...props} />
}

export const ActionMenuSubTrigger = (props: ActionMenuSubTriggerProps) => (
  <ActionMenuPrimitive.SubTrigger {...props} />
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
