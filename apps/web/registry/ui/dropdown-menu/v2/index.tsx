import { cn } from '@/lib/utils'
import { Menu } from '@bazza-ui/dropdown-menu/v2'

const Root = ({ ...props }: Menu.Root.Props) => <Menu.Root {...props} />

const Trigger = ({ ...props }: Menu.Trigger.Props) => (
  <Menu.Trigger {...props} />
)

const Portal = ({ ...props }: Menu.Portal.Props) => <Menu.Portal {...props} />

const Positioner = ({ className, ...props }: Menu.Positioner.Props) => (
  <Menu.Positioner className={cn('z-50', className)} {...props} />
)

const Surface = ({ className, ...props }: Menu.Surface.Props) => (
  <Menu.Surface
    className={cn(
      'border bg-popover z-50 rounded-lg flex flex-col text-sm',
      'drop-shadow-xl',
      // 'data-[root-menu]:data-[open]:animate-in data-[root-menu]:data-[open]:fade-in-0 data-[root-menu]:data-[open]:zoom-in-95',
      // 'data-[root-menu]:data-[closed]:animate-out data-[root-menu]:data-[closed]:fade-out-0 data-[root-menu]:data-[closed]:zoom-out-95',
      // 'data-[root-menu]:data-[open]:origin-(--transform-origin) data-[root-menu]:data-[closed]:origin-(--transform-origin)',
      // 'data-[root-menu]:data-[open]:transition-[filter,scale,opacity] data-[root-menu]:data-[open]:duration-150 data-[root-menu]:data-[open]:ease-out',
      // 'data-[root-menu]:data-[closed]:transition-[filter,scale,opacity] data-[root-menu]:data-[closed]:duration-150 data-[root-menu]:data-[closed]:ease-out',
      // 'w-[min(400px,max(var(--row-width),175px))]',
      // 'max-h-[min(500px,var(--action-menu-available-height))]',
      'box-content',
      className,
    )}
    {...props}
  />
)

const Input = ({ className, ...props }: Menu.Input.Props) => (
  <Menu.Input
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

const List = ({ className, ...props }: Menu.List.Props) => (
  <Menu.List
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

const Item = ({ className, ...props }: Menu.Item.Props) => (
  <Menu.Item
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

const Group = ({ ...props }: Menu.Group.Props) => <Menu.Group {...props} />

const Separator = ({ ...props }: Menu.Separator.Props) => (
  <Menu.Separator {...props} />
)

const CheckboxItem = ({ ...props }: Menu.CheckboxItem.Props) => (
  <Menu.CheckboxItem {...props} />
)

const RadioGroup = ({ ...props }: Menu.RadioGroup.Props) => (
  <Menu.RadioGroup {...props} />
)

const RadioItem = ({ ...props }: Menu.RadioItem.Props) => (
  <Menu.RadioItem {...props} />
)

const Submenu = ({ ...props }: Menu.Submenu.Props) => (
  <Menu.Submenu {...props} />
)

const SubmenuTrigger = ({
  className,
  children,
  ...props
}: Menu.Submenu.Trigger.Props) => (
  <Menu.Submenu.Trigger
    className={cn(
      'group flex items-center justify-between gap-2 text-sm select-none aria-disabled:opacity-50',
      'data-[highlighted]:not-disabled:text-accent-foreground',
      'py-1.5 px-4',
      'w-full relative z-1',
      'before:absolute before:top-0 before:left-1 before:right-1 before:h-full data-[highlighted]:not-disabled:before:bg-accent before:rounded-md before:z-[-1]',
      className,
    )}
    {...props}
  >
    <div className="flex items-center gap-2 min-w-0">{children}</div>
    <TriangleRightIcon className="text-muted-foreground/75 shrink-0 size-4" />
  </Menu.Submenu.Trigger>
)

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
      <path d="M6 11L6 4L10.5 7.5L6 11Z" fill="currentColor" />
    </svg>
  )
}

export {
  Root,
  Trigger,
  Portal,
  Positioner,
  Surface,
  Input,
  List,
  Item,
  Group,
  Separator,
  CheckboxItem,
  RadioGroup,
  RadioItem,
  Submenu,
  SubmenuTrigger,
}
